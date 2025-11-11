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
export interface MLTrainingMetrics {
    summary: {
        accuracy: number;
        macro_f1: number;
        roc_auc: number;
    };
    confusion_matrix: Record<string, Record<string, number>>;
    classification_report: Record<string, unknown>;
}
export declare class MLApiClient {
    private baseUrl;
    private timeout;
    constructor();
    predictBurnoutRisk(userId: string, features: Record<string, number>, modelVersion?: string): Promise<MLPredictionResponse>;
    triggerTabularTraining(): Promise<MLTrainingSummary>;
    fetchEdaReport(): Promise<MLEdaReport>;
    fetchTrainingMetrics(): Promise<MLTrainingMetrics>;
    getPredictionHistory(userId: string, _limit?: number): Promise<MLPredictionResponse[]>;
    checkHealth(): Promise<boolean>;
    getModelVersions(): Promise<string[]>;
    private makeRequest;
    private getFallbackPrediction;
}
export declare const mlApiClient: MLApiClient;
//# sourceMappingURL=mlApiClient.service.d.ts.map