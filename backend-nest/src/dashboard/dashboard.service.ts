import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployeeDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { burnoutScore: true, metadata: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const burnout = user.burnoutScore;
    const metadata = user.metadata;

    return {
      user: this.mapUser(user),
      riskLevel: burnout?.score ? this.scoreToLevel(burnout.score) : 'medium',
      riskScore: burnout?.score ?? 50,
      confidence: burnout?.confidence ?? 0.75,
      probabilities: (burnout?.probabilities as Record<string, number>) ?? {},
      factors: (burnout?.riskFactors as Record<string, number>) ?? metadata?.stressIndicators ?? {},
      workPatterns: metadata?.workPatterns ?? {},
      recommendations:
        (burnout?.recommendations as any[] | undefined) ?? this.buildRecommendations(metadata, burnout),
      updatedAt: burnout?.updatedAt ?? user.updatedAt,
    };
  }

  async getEmployeeDetails(userId: string) {
    return this.getEmployeeDashboard(userId);
  }

  async getAdminOverview() {
    const users = await this.prisma.user.findMany({
      include: { burnoutScore: true, metadata: true },
    });

    const summary = this.buildAdminSummary(users);

    return {
      summary,
      employees: users.map((user) => ({
        ...this.mapUser(user),
        riskLevel: user.burnoutScore?.score
          ? this.scoreToLevel(user.burnoutScore.score)
          : 'medium',
        riskScore: user.burnoutScore?.score ?? 50,
        confidence: user.burnoutScore?.confidence ?? 0.75,
        trend: user.burnoutScore?.trend ?? 'stable',
        workPatterns: user.metadata?.workPatterns ?? {},
        updatedAt: user.burnoutScore?.updatedAt ?? user.updatedAt,
      })),
    };
  }

  async getAdminEmployee(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { burnoutScore: true, metadata: true },
    });

    if (!user) {
      throw new NotFoundException('Employee not found');
    }

    return {
      ...this.mapUser(user),
      riskLevel: user.burnoutScore?.score
        ? this.scoreToLevel(user.burnoutScore.score)
        : 'medium',
      riskScore: user.burnoutScore?.score ?? 50,
      confidence: user.burnoutScore?.confidence ?? 0.75,
      workPatterns: user.metadata?.workPatterns ?? {},
      factors:
        (user.burnoutScore?.riskFactors as Record<string, number>) ??
        user.metadata?.stressIndicators ??
        {},
      trend: user.burnoutScore?.trend ?? 'stable',
      lastUpdated: user.burnoutScore?.updatedAt ?? user.updatedAt,
      recommendations:
        (user.burnoutScore?.recommendations as any[] | undefined) ?? this.buildRecommendations(user.metadata, user.burnoutScore),
      probabilities: (user.burnoutScore?.probabilities as Record<string, number>) ?? {},
    };
  }

  private mapUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  private scoreToLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }

  private buildRecommendations(metadata: any, burnout: any) {
    const recs = [] as Array<{ title: string; description: string; priority: string; category: string }>;

    const workLife = metadata?.stressIndicators?.workLifeBalance ?? 0.5;
    const stress = metadata?.stressIndicators?.stressLevel ?? 0;
    const workload = metadata?.stressIndicators?.workloadLevel ?? 0;

    if (workload > 3) {
      recs.push({
        title: 'Balance workload distribution',
        description: 'Delegate tasks and review workload with your manager to avoid overload.',
        priority: 'high',
        category: 'workload',
      });
    }

    if (stress > 3) {
      recs.push({
        title: 'Introduce recovery blocks',
        description: 'Schedule deep-work blocks and short breaks after intense meetings.',
        priority: 'high',
        category: 'stress',
      });
    }

    if (workLife < 0.4) {
      recs.push({
        title: 'Reinforce work-life boundaries',
        description: 'Define clear stop times and reduce after-hours communication.',
        priority: 'medium',
        category: 'lifestyle',
      });
    }

    if (recs.length === 0) {
      recs.push({
        title: 'Maintain healthy routines',
        description: 'Continue monitoring workload and keep investing in recovery habits.',
        priority: 'medium',
        category: 'general',
      });
    }

    return recs;
  }

  private buildAdminSummary(users: any[]) {
    const employees = users.filter((user) => user.role === Role.EMPLOYEE);
    const total = employees.length;
    const riskBuckets = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    employees.forEach((user) => {
      const level = user.burnoutScore?.score
        ? this.scoreToLevel(user.burnoutScore.score)
        : 'medium';
      riskBuckets[level] += 1;
    });

    const averageScore =
      employees.reduce((acc, user) => acc + (user.burnoutScore?.score ?? 50), 0) /
      (total || 1);

    return {
      totalEmployees: total,
      averageRiskScore: Math.round(averageScore),
      riskBuckets,
    };
  }
}
