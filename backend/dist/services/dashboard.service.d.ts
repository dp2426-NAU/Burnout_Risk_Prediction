import { IPredictionResult } from '../models/predictionResult.model';
import { MLEdaReport, MLTrainingMetrics } from './mlApiClient.service';
interface DailySummary {
    meetingsAttended: number;
    emailsResponded: number;
    workHours: number;
}
interface RiskHistoryPoint {
    date: string;
    riskScore: number;
    riskLevel: string;
    confidence: number;
}
export interface EmployeeOverview {
    profile: {
        id: string;
        name: string;
        role: string;
        jobTitle?: string;
        department?: string;
        experienceYears?: number;
    };
    dailySummary: DailySummary;
    riskSnapshot: {
        riskLevel: string;
        riskScore: number;
        confidence: number;
        updatedAt: string;
        recommendations: IPredictionResult['recommendations'];
    } | null;
    history: RiskHistoryPoint[];
}
export interface SimulationAdjustments {
    meetingHours?: number;
    workHours?: number;
    sleepHours?: number;
    stressLevel?: number;
    workloadLevel?: number;
}
export interface SimulationResult {
    baseline: {
        riskLevel: string;
        riskScore: number;
        confidence: number;
    } | null;
    adjusted: {
        riskLevel: string;
        riskScore: number;
        confidence: number;
    };
    delta: number | null;
    tips: string[];
}
export interface ManagerOverview {
    summary: {
        totalEmployees: number;
        lowRisk: number;
        mediumRisk: number;
        highRisk: number;
        criticalRisk: number;
    };
    departmentDistribution: Array<{
        department: string;
        averageRiskScore: number;
        employeeCount: number;
    }>;
    trend: RiskHistoryPoint[];
}
export interface EmployeeInsight {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    jobTitle?: string;
    riskLevel: string;
    riskScore: number;
    workPatterns?: any;
    recommendedActions: IPredictionResult['recommendations'];
}
export interface ModelOperationsPayload {
    metrics: MLTrainingMetrics | null;
    eda: MLEdaReport | null;
}
export declare function buildEmployeeOverview(userId: string): Promise<EmployeeOverview>;
export declare function simulateBurnout(userId: string, adjustments: SimulationAdjustments): Promise<SimulationResult>;
export declare function buildManagerOverview(): Promise<ManagerOverview>;
export declare function fetchEmployeeInsights(): Promise<EmployeeInsight[]>;
export declare function fetchModelOperations(): Promise<ModelOperationsPayload>;
export {};
//# sourceMappingURL=dashboard.service.d.ts.map