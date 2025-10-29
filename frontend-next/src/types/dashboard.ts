export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Recommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface EmployeeDashboardResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  riskLevel: RiskLevel;
  riskScore: number;
  confidence: number;
  probabilities: Record<string, number>;
  factors: Record<string, number>;
  workPatterns: Record<string, number>;
  recommendations: Recommendation[];
  updatedAt: string;
}

export interface AdminEmployeeSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  riskLevel: RiskLevel;
  riskScore: number;
  confidence: number;
  trend: string;
  workPatterns: Record<string, number>;
  probabilities?: Record<string, number>;
  updatedAt: string;
}

export interface AdminDashboardResponse {
  summary: {
    totalEmployees: number;
    averageRiskScore: number;
    riskBuckets: Record<RiskLevel, number>;
  };
  employees: AdminEmployeeSummary[];
}

export interface AdminMetrics {
  summary: {
    accuracy: number;
    macro_f1: number;
    roc_auc: number;
  };
  confusion_matrix: Record<string, Record<string, number>>;
  classification_report: Record<string, Record<string, number>>;
  metric_file: string | null;
}
