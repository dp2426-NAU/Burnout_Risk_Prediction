import { IPredictionResult } from '../models/predictionResult.model';
export interface PredictionRequest {
    userId: string;
    startDate: Date;
    endDate: Date;
    additionalData?: {
        sleepQuality?: number;
        exerciseFrequency?: number;
        nutritionQuality?: number;
        socialSupport?: number;
        jobSatisfaction?: number;
    };
}
export interface PredictionResponse {
    success: boolean;
    prediction?: IPredictionResult;
    message?: string;
}
export declare function generatePrediction(request: PredictionRequest): Promise<PredictionResponse>;
export declare function getLatestPrediction(userId: string): Promise<IPredictionResult | null>;
export declare function getPredictionHistory(userId: string, limit?: number): Promise<IPredictionResult[]>;
//# sourceMappingURL=prediction.service.d.ts.map