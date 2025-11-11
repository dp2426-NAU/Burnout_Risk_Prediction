import mongoose, { Document } from 'mongoose';
export interface IPredictionResult extends Document {
    userId: mongoose.Types.ObjectId;
    predictionDate: Date;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    confidence: number;
    factors: {
        workload: number;
        stressLevel: number;
        workLifeBalance: number;
        socialSupport: number;
        jobSatisfaction: number;
        physicalHealth: number;
        mentalHealth: number;
        sleepQuality: number;
        exerciseFrequency: number;
        nutritionQuality: number;
    };
    recommendations: {
        priority: 'high' | 'medium' | 'low';
        category: 'workload' | 'stress' | 'lifestyle' | 'social' | 'health';
        title: string;
        description: string;
        actionItems: string[];
        resources?: string[];
    }[];
    dataPoints: {
        calendarEvents: number;
        emailMessages: number;
        surveyResponses: number;
        biometricData: number;
    };
    modelVersion: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IPredictionResultModel extends mongoose.Model<IPredictionResult> {
    findLatestByUser(userId: mongoose.Types.ObjectId): Promise<IPredictionResult | null>;
    findByRiskLevel(riskLevel: 'low' | 'medium' | 'high' | 'critical', limit?: number): Promise<IPredictionResult[]>;
    calculateRiskTrends(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<any[]>;
}
export declare const PredictionResult: IPredictionResultModel;
//# sourceMappingURL=predictionResult.model.d.ts.map