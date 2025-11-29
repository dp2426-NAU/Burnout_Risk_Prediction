// ML API Client Service - Created by Harish S & Team
/**
 * Service for communicating with the ML service API to get real predictions
 * instead of using hardcoded formulas.
 */

import { logger } from '../utils/logger';

// Interface for ML API prediction response
export interface MLPredictionResponse {
  riskLevel: string;
  riskScore: number;
  confidence: number;
  probabilities: Record<string, number>;
  features: Record<string, number>;
}

// Interface for ML API error response
export interface MLErrorResponse {
  detail: string;
}

export interface MLEdaReport {
  summary: Record<string, Record<string, number>>;
  label_distribution: Record<string, number>;
  top_correlations: Record<string, number>;
  charts: Record<string, string | null>;
  sample_rows: Array<Record<string, unknown>>;
}

export interface MLTrainingSummary {
  baseline_metrics: Record<string, Record<string, number>>;
  advanced_trained: boolean;
  confusion_matrix: Record<string, Record<string, number>>;
  classification_report: Record<string, unknown>;
  metric_file: string | null;
  eda?: MLEdaReport;
  trained_samples?: number;
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
      const body = {
        employeeId: userId,
        features,
        metadata: {
          modelVersion
        }
      };

      logger.info(`Sending prediction request to ML service for user ${userId}`);

      const response = await this.makeRequest('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = (await response.json()) as MLErrorResponse;
        throw new Error(`ML API error: ${errorData.detail}`);
      }

      const prediction = (await response.json()) as MLPredictionResponse;

      logger.info(`Received prediction from ML service: ${prediction.riskLevel} (${prediction.riskScore})`);

      return prediction;

    } catch (error: unknown) {
      logger.error('Error calling ML API:', error);

      // Return fallback prediction if ML service is unavailable
      return this.getFallbackPrediction(userId, features);
    }
  }

  async triggerTabularTraining(): Promise<MLTrainingSummary> {
    try {
      const response = await this.makeRequest('/train/tabular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ML training failed: ${errorText}`);
      }

      const summary = (await response.json()) as MLTrainingSummary;
      logger.info('ML service retraining completed successfully');
      return summary;
    } catch (error: unknown) {
      logger.error('Error triggering ML retraining:', error);
      throw error;
    }
  }

  async fetchEdaReport(): Promise<MLEdaReport> {
    try {
      const response = await this.makeRequest('/eda', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        const notFoundError = new Error('EDA report not available');
        (notFoundError as any).status = 404;
        throw notFoundError;
      }

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Unable to fetch EDA report: ${errorText}`);
        (error as any).status = response.status;
        throw error;
      }

      const report = (await response.json()) as MLEdaReport;
      return report;
    } catch (error: unknown) {
      logger.error('Error fetching EDA report from ML service:', error);
      throw error;
    }
  }

  /**
   * Get prediction history for a user from ML service
   */
  async getPredictionHistory(
    userId: string,
    limit: number = 10
  ): Promise<MLPredictionResponse[]> {
    logger.warn('Prediction history endpoint not implemented in ML service. Returning empty list.');
    return [];
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
    } catch (error: unknown) {
      logger.error('ML service health check failed:', error);
      return false;
    }
  }

  /**
   * Get available model versions from ML service
   */
  async getModelVersions(): Promise<string[]> {
    return ['baseline'];
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
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Normalize features to match ML service expectations
   */
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
      riskLevel,
      riskScore,
      confidence: 0.5,
      probabilities: {
        low: riskLevel === 'low' ? 0.7 : 0.1,
        medium: riskLevel === 'medium' ? 0.6 : 0.1,
        high: riskLevel === 'high' ? 0.6 : 0.1,
        critical: riskLevel === 'critical' ? 0.6 : 0.1
      },
      features,
    };
  }
}

// Export singleton instance
export const mlApiClient = new MLApiClient();

