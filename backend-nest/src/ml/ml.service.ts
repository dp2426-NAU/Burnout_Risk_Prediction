import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface MlPredictionResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  confidence: number;
  probabilities: Record<string, number>;
  features: Record<string, number>;
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);

  constructor(private readonly http: HttpService) {}

  async predict(payload: Record<string, unknown>): Promise<MlPredictionResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<MlPredictionResult>('/predict', payload),
      );
      return response.data;
    } catch (error) {
      this.logger.error('ML prediction failed', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async getMetrics(): Promise<Record<string, any>> {
    try {
      const response = await firstValueFrom(this.http.get<Record<string, any>>('/metrics'));
      return response.data;
    } catch (error) {
      this.logger.error('Failed to retrieve ML metrics', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
