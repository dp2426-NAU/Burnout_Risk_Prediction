export interface MLPredictionResponse {
    riskLevel: string;
    riskScore: number;
    confidence: number;
    probabilities: Record<string, number>;
    features: Record<string, number>;
}
export interface MLErrorResponse {
    detail: string;
}
export declare class MLApiClient {
    private baseUrl;
    private timeout;
    constructor();
    predictBurnoutRisk(userId: string, features: Record<string, number>, modelVersion?: string): Promise<MLPredictionResponse>;
    getPredictionHistory(userId: string, limit?: number): Promise<MLPredictionResponse[]>;
    checkHealth(): Promise<boolean>;
    getModelVersions(): Promise<string[]>;
    private makeRequest;
    private getFallbackPrediction;
}
export declare const mlApiClient: MLApiClient;
//# sourceMappingURL=mlApiClient.service.d.ts.map