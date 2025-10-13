// ML API Client Service - Created by Balaji Koneti
/**
 * Service for communicating with the ML service API to get real predictions
 * instead of using hardcoded formulas.
 */

import { logger } from '../utils/logger';

// Interface for ML API prediction request
export interface MLPredictionRequest {
  user_id: string;
  features: Record<string, number>;
  model_version?: string;
}

// Interface for ML API prediction response
export interface MLPredictionResponse {
  prediction_id: string;
  user_id: string;
  risk_level: string;
  risk_score: number;
  confidence: number;
  factors: Record<string, any>;
  recommendations: string[];
  model_version: string;
  prediction_date: string;
}

// Interface for ML API error response
export interface MLErrorResponse {
  detail: string;
}

export class MLApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Get ML service URL from environment variables
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';
    this.timeout = parseInt(process.env.ML_API_TIMEOUT || '10000');
    
    logger.info(`ML API Client initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Generate a burnout risk prediction using the ML service
   */
  async predictBurnoutRisk(
    userId: string,
    features: Record<string, number>,
    modelVersion: string = 'latest'
  ): Promise<MLPredictionResponse> {
    try {
      const request: MLPredictionRequest = {
        user_id: userId,
        features: this.normalizeFeatures(features),
        model_version: modelVersion
      };

      logger.info(`Sending prediction request to ML service for user ${userId}`);

      const response = await this.makeRequest('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData: MLErrorResponse = await response.json();
        throw new Error(`ML API error: ${errorData.detail}`);
      }

      const prediction: MLPredictionResponse = await response.json();
      
      logger.info(`Received prediction from ML service: ${prediction.risk_level} (${prediction.risk_score})`);
      
      return prediction;

    } catch (error) {
      logger.error(`Error calling ML API: ${error}`);
      
      // Return fallback prediction if ML service is unavailable
      return this.getFallbackPrediction(userId, features);
    }
  }

  /**
   * Get prediction history for a user from ML service
   */
  async getPredictionHistory(
    userId: string,
    limit: number = 10
  ): Promise<MLPredictionResponse[]> {
    try {
      const response = await this.makeRequest(`/predictions/${userId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData: MLErrorResponse = await response.json();
        throw new Error(`ML API error: ${errorData.detail}`);
      }

      const predictions: MLPredictionResponse[] = await response.json();
      return predictions;

    } catch (error) {
      logger.error(`Error getting prediction history from ML API: ${error}`);
      return [];
    }
  }

  /**
   * Check if ML service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.ok;
    } catch (error) {
      logger.error(`ML service health check failed: ${error}`);
      return false;
    }
  }

  /**
   * Get available model versions from ML service
   */
  async getModelVersions(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData: MLErrorResponse = await response.json();
        throw new Error(`ML API error: ${errorData.detail}`);
      }

      const data = await response.json();
      return data.model_versions || [];

    } catch (error) {
      logger.error(`Error getting model versions from ML API: ${error}`);
      return ['latest'];
    }
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Normalize features to match ML service expectations
   */
  private normalizeFeatures(features: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};
    
    // Map backend feature names to ML service expected names
    const featureMapping: Record<string, string> = {
      'workHours': 'work_hours_per_week',
      'overtimeHours': 'overtime_hours',
      'weekendWork': 'weekend_work_hours',
      'earlyMorningWork': 'early_morning_hours',
      'lateNightWork': 'late_night_hours',
      'meetingCount': 'meeting_hours_per_week',
      'meetingDuration': 'avg_meeting_duration',
      'backToBackMeetings': 'back_to_back_meetings',
      'virtualMeetings': 'virtual_meeting_ratio',
      'emailCount': 'email_count_per_day',
      'avgEmailLength': 'avg_email_length',
      'stressEmailCount': 'stress_email_count',
      'urgentEmailCount': 'urgent_email_count',
      'responseTime': 'avg_response_time',
      'totalEvents': 'total_calendar_events',
      'avgEventDuration': 'avg_event_duration',
      'focusTimeRatio': 'focus_time_ratio',
      'breakTimeRatio': 'break_time_ratio',
      'stressLevel': 'stress_level',
      'workloadLevel': 'workload_score',
      'workLifeBalance': 'work_life_balance',
      'socialInteraction': 'social_interaction_score',
      'teamCollaboration': 'team_collaboration_score',
      'sleepQuality': 'sleep_quality_score',
      'exerciseFrequency': 'exercise_frequency_score',
      'nutritionQuality': 'nutrition_quality_score'
    };

    // Apply mapping and ensure all expected features are present
    const expectedFeatures = [
      'work_hours_per_week',
      'meeting_hours_per_week',
      'email_count_per_day',
      'stress_level',
      'workload_score',
      'work_life_balance',
      'team_size',
      'remote_work_percentage',
      'overtime_hours',
      'deadline_pressure'
    ];

    for (const [backendKey, mlKey] of Object.entries(featureMapping)) {
      if (features[backendKey] !== undefined) {
        normalized[mlKey] = features[backendKey];
      }
    }

    // Fill in missing features with default values
    for (const feature of expectedFeatures) {
      if (normalized[feature] === undefined) {
        normalized[feature] = 0.0;
      }
    }

    return normalized;
  }

  /**
   * Generate fallback prediction when ML service is unavailable
   */
  private getFallbackPrediction(
    userId: string,
    features: Record<string, number>
  ): MLPredictionResponse {
    logger.warn(`Using fallback prediction for user ${userId} - ML service unavailable`);
    
    // Simple fallback calculation based on key features
    const workHours = features.workHours || 0;
    const stressLevel = features.stressLevel || 0;
    const workloadLevel = features.workloadLevel || 0;
    
    // Simple weighted calculation for fallback
    const riskScore = Math.min(1.0, (workHours * 0.3 + stressLevel * 0.4 + workloadLevel * 0.3) / 10);
    
    let riskLevel: string;
    if (riskScore < 0.3) riskLevel = 'low';
    else if (riskScore < 0.6) riskLevel = 'medium';
    else if (riskScore < 0.8) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      prediction_id: `fallback_${Date.now()}`,
      user_id: userId,
      risk_level: riskLevel,
      risk_score: riskScore,
      confidence: 0.5, // Lower confidence for fallback
      factors: {
        workload: workloadLevel,
        stress_level: stressLevel,
        work_life_balance: features.workLifeBalance || 0.5,
        note: 'Fallback prediction - ML service unavailable'
      },
      recommendations: [
        'ML service is currently unavailable. Please try again later.',
        'Consider monitoring your work hours and stress levels.',
        'Take regular breaks and maintain work-life balance.'
      ],
      model_version: 'fallback',
      prediction_date: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const mlApiClient = new MLApiClient();

