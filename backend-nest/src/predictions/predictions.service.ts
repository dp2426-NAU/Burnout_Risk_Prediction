import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MlService, MlPredictionResult } from '../ml/ml.service';
import { Role, WorkMetadata } from '@prisma/client';

interface GeneratePredictionOptions {
  additionalData?: Record<string, number>;
  requestedBy?: {
    id: string;
    role: Role;
  };
}

interface GeneratedRecommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

@Injectable()
export class PredictionsService {
  constructor(private readonly prisma: PrismaService, private readonly mlService: MlService) {}

  async generatePredictionForUser(
    userId: string,
    options: GeneratePredictionOptions = {},
  ): Promise<MlPredictionResult & { userId: string; recommendations: GeneratedRecommendation[] }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const metadata = await this.prisma.workMetadata.findUnique({ where: { userId } });

    const features = this.buildFeaturePayload(metadata, options.additionalData);

    const prediction = await this.mlService.predict({
      employeeId: userId,
      features,
      metadata: {
        requestedBy: options.requestedBy,
        user: {
          role: user.role,
        },
      },
    });

    const recommendations = this.generateRecommendations(prediction.riskLevel, prediction.features, prediction.probabilities);

    await this.persistPrediction(userId, prediction, metadata ?? null, features, recommendations);

    return {
      ...prediction,
      userId,
      recommendations,
    };
  }

  async getLatestPrediction(userId: string) {
    return this.prisma.burnoutScore.findUnique({ where: { userId } });
  }

  private buildFeaturePayload(
    metadata: WorkMetadata | null,
    overrides: Record<string, number> | undefined,
  ): Record<string, number> {
    const stressIndicators = (metadata?.stressIndicators as Record<string, number>) ?? {};
    const patterns = (metadata?.workPatterns as Record<string, number>) ?? {};

    const baseFeatures: Record<string, number> = {
      meetingCount: metadata?.meetingCount ?? 0,
      meetingDuration: patterns.meetingDuration ?? metadata?.meetingCount ?? 0,
      workHours: metadata?.workHours ?? 0,
      overtimeHours: patterns.overtimeHours ?? 0,
      weekendWork: patterns.weekendWork ?? 0,
      earlyMorningWork: patterns.earlyMorningWork ?? 0,
      lateNightWork: patterns.lateNightWork ?? 0,
      emailCount: patterns.emailCount ?? 0,
      avgEmailLength: patterns.avgEmailLength ?? 0,
      stressEmailCount: patterns.stressEmailCount ?? 0,
      urgentEmailCount: patterns.urgentEmailCount ?? 0,
      responseTime: patterns.responseTime ?? 0,
      totalEvents: metadata?.meetingCount ?? 0,
      avgEventDuration: patterns.avgEventDuration ?? 0,
      focusTimeRatio: patterns.focusTimeRatio ?? 0.3,
      breakTimeRatio: patterns.breakTimeRatio ?? 0.2,
      stressLevel: stressIndicators.stressLevel ?? 0,
      workloadLevel: stressIndicators.workloadLevel ?? 0,
      workLifeBalance: stressIndicators.workLifeBalance ?? 0.5,
      socialInteraction: stressIndicators.socialSupport ?? 0.5,
      teamCollaboration: patterns.teamCollaboration ?? 0.5,
      sleepQuality: patterns.sleepQuality ?? 0.5,
      exerciseFrequency: patterns.exerciseFrequency ?? 0.3,
      nutritionQuality: patterns.nutritionQuality ?? 0.4,
    };

    if (overrides) {
      for (const [key, value] of Object.entries(overrides)) {
        baseFeatures[key] = value;
      }
    }

    return baseFeatures;
  }

  private async persistPrediction(
    userId: string,
    prediction: MlPredictionResult,
    metadata: WorkMetadata | null,
    features: Record<string, number>,
    recommendations: GeneratedRecommendation[],
  ) {
    await this.prisma.burnoutScore.upsert({
      where: { userId },
      create: {
        userId,
        score: Math.round(prediction.riskScore * 100),
        confidence: prediction.confidence,
        riskFactors: prediction.features,
        trend: this.estimateTrend(prediction.riskLevel),
        probabilities: prediction.probabilities,
        recommendations,
      },
      update: {
        score: Math.round(prediction.riskScore * 100),
        confidence: prediction.confidence,
        riskFactors: prediction.features,
        trend: this.estimateTrend(prediction.riskLevel),
        updatedAt: new Date(),
        probabilities: prediction.probabilities,
        recommendations,
      },
    });

    await this.prisma.workMetadata.upsert({
      where: { userId },
      create: {
        userId,
        meetingCount: features.meetingCount ?? 0,
        workHours: features.workHours ?? 0,
        stressIndicators: {
          stressLevel: features.stressLevel ?? 0,
          workloadLevel: features.workloadLevel ?? 0,
          workLifeBalance: features.workLifeBalance ?? 0.5,
          socialSupport: features.socialInteraction ?? 0.5,
        },
        workPatterns: features,
      },
      update: {
        meetingCount: features.meetingCount ?? 0,
        workHours: features.workHours ?? 0,
        stressIndicators: {
          stressLevel: features.stressLevel ?? 0,
          workloadLevel: features.workloadLevel ?? 0,
          workLifeBalance: features.workLifeBalance ?? 0.5,
          socialSupport: features.socialInteraction ?? 0.5,
        },
        workPatterns: features,
      },
    });
  }

  private generateRecommendations(
    riskLevel: string,
    riskFactors: Record<string, number>,
    probabilities: Record<string, number>,
  ): GeneratedRecommendation[] {
    const topFactors = Object.entries(riskFactors || {})
      .filter(([, value]) => typeof value === 'number')
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 4);

    const recommendations: GeneratedRecommendation[] = [];

    for (const [key, rawValue] of topFactors) {
      const value = Number(rawValue);
      if (value < 0.4) continue;
      const { title, description, category } = this.buildRecommendationForFactor(key, value);
      recommendations.push({
        title,
        description,
        category,
        priority: riskLevel === 'critical' || riskLevel === 'high' ? 'high' : 'medium',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Maintain resilience practices',
        description: 'Continue reinforcing habits that keep your risk stable such as focus blocks and recovery time.',
        category: 'general',
        priority: 'medium',
      });
    }

    const criticalProbability = probabilities?.critical ?? 0;
    if (criticalProbability >= 0.2) {
      recommendations.unshift({
        title: 'Escalate to support resources',
        description: 'Model confidence indicates sustained high risk. Partner with your manager and wellbeing coach to reduce load.',
        category: 'support',
        priority: 'high',
      });
    }

    return recommendations.slice(0, 4);
  }

  private buildRecommendationForFactor(key: string, value: number) {
    const normalizedKey = key.replace(/^meta_/, '');
    switch (normalizedKey) {
      case 'meeting_count':
      case 'meetingDuration':
        return {
          title: 'Streamline meeting load',
          description: 'Cluster similar meetings, enforce agendas, and reserve deep work blocks to protect recovery time.',
          category: 'workload',
        };
      case 'stressLevel':
      case 'stress_level':
        return {
          title: 'Trigger recovery micro-breaks',
          description: 'Introduce 10-minute decompression slots after high-pressure work and use breathing routines to reset.',
          category: 'stress',
        };
      case 'workLifeBalance':
      case 'work_life_balance':
        return {
          title: 'Reinforce work-life boundaries',
          description: 'Establish a hard stop, disable notifications outside focus hours, and schedule personal time windows.',
          category: 'lifestyle',
        };
      case 'sleepQuality':
        return {
          title: 'Protect sleep hygiene',
          description: 'Set device curfew, adopt wind-down rituals, and schedule lighter tasks near the end of the day.',
          category: 'health',
        };
      case 'exerciseFrequency':
        return {
          title: 'Increase restorative movement',
          description: 'Block two 20-minute movement breaks per week to improve energy and emotional regulation.',
          category: 'health',
        };
      case 'socialInteraction':
        return {
          title: 'Boost social buffers',
          description: 'Schedule quick alignment or peer-support sessions to reinforce psychological safety.',
          category: 'social',
        };
      default:
        return {
          title: 'Focus on high-impact factor',
          description: 'Review this metric with your manager to identify actions that reduce overload and stress.',
          category: 'general',
        };
    }
  }

  private estimateTrend(riskLevel: string): string {
    switch (riskLevel) {
      case 'low':
        return 'improving';
      case 'medium':
        return 'stable';
      case 'high':
        return 'increasing';
      case 'critical':
        return 'escalating';
      default:
        return 'stable';
    }
  }
}
