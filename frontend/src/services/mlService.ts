import { apiClient, ApiResponse } from './apiClient';

export interface EdaReport {
  summary: Record<string, Record<string, number>>;
  label_distribution: Record<string, number>;
  top_correlations: Record<string, number>;
  charts: Record<string, string | null>;
  sample_rows: Array<Record<string, unknown>>;
}

export interface TrainingSummary {
  baseline_metrics: Record<string, Record<string, number>>;
  advanced_trained: boolean;
  confusion_matrix: Record<string, Record<string, number>>;
  classification_report: Record<string, unknown>;
  metric_file: string | null;
  eda?: EdaReport;
  trained_samples?: number;
}

export const mlService = {
  async triggerRetraining(): Promise<ApiResponse<TrainingSummary>> {
    return apiClient.post<TrainingSummary>('/ml/retrain', {});
  },

  async fetchEdaReport(): Promise<ApiResponse<EdaReport>> {
    return apiClient.get<EdaReport>('/ml/eda');
  },
};

