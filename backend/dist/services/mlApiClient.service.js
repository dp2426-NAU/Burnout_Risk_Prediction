"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mlApiClient = exports.MLApiClient = void 0;
const logger_1 = require("../utils/logger");
class MLApiClient {
    constructor() {
        this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        this.timeout = parseInt(process.env.ML_API_TIMEOUT || '10000');
        logger_1.logger.info(`ML API Client initialized with base URL: ${this.baseUrl}`);
    }
    async predictBurnoutRisk(userId, features, modelVersion = 'latest') {
        try {
            const body = {
                employeeId: userId,
                features,
                metadata: {
                    modelVersion
                }
            };
            logger_1.logger.info(`Sending prediction request to ML service for user ${userId}`);
            const response = await this.makeRequest('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`ML API error: ${errorData.detail}`);
            }
            const prediction = await response.json();
            logger_1.logger.info(`Received prediction from ML service: ${prediction.riskLevel} (${prediction.riskScore})`);
            return prediction;
        }
        catch (error) {
            logger_1.logger.error(`Error calling ML API: ${error}`);
            return this.getFallbackPrediction(userId, features);
        }
    }
    async triggerTabularTraining() {
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
            const summary = await response.json();
            logger_1.logger.info('ML service retraining completed successfully');
            return summary;
        }
        catch (error) {
            logger_1.logger.error('Error triggering ML retraining:', error);
            throw error;
        }
    }
    async fetchEdaReport() {
        try {
            const response = await this.makeRequest('/eda', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 404) {
                const notFoundError = new Error('EDA report not available');
                notFoundError.status = 404;
                throw notFoundError;
            }
            if (!response.ok) {
                const errorText = await response.text();
                const error = new Error(`Unable to fetch EDA report: ${errorText}`);
                error.status = response.status;
                throw error;
            }
            const report = await response.json();
            return report;
        }
        catch (error) {
            logger_1.logger.error('Error fetching EDA report from ML service:', error);
            throw error;
        }
    }
    async fetchTrainingMetrics() {
        try {
            const response = await this.makeRequest('/metrics', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 404) {
                const notFoundError = new Error('Training metrics not available');
                notFoundError.status = 404;
                throw notFoundError;
            }
            if (!response.ok) {
                const errorText = await response.text();
                const error = new Error(`Unable to fetch training metrics: ${errorText}`);
                error.status = response.status;
                throw error;
            }
            const metrics = await response.json();
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Error fetching training metrics from ML service:', error);
            throw error;
        }
    }
    async getPredictionHistory(userId, _limit = 10) {
        logger_1.logger.warn('Prediction history endpoint not implemented in ML service. Returning empty list.');
        return [];
    }
    async checkHealth() {
        try {
            const response = await this.makeRequest('/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return response.ok;
        }
        catch (error) {
            logger_1.logger.error(`ML service health check failed: ${error}`);
            return false;
        }
    }
    async getModelVersions() {
        return ['baseline'];
    }
    async makeRequest(endpoint, options) {
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
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.timeout}ms`);
            }
            throw error;
        }
    }
    getFallbackPrediction(userId, features) {
        logger_1.logger.warn(`Using fallback prediction for user ${userId} - ML service unavailable`);
        const workHours = features.workHours || 0;
        const stressLevel = features.stressLevel || 0;
        const workloadLevel = features.workloadLevel || 0;
        const riskScore = Math.min(1.0, (workHours * 0.3 + stressLevel * 0.4 + workloadLevel * 0.3) / 10);
        let riskLevel;
        if (riskScore < 0.3)
            riskLevel = 'low';
        else if (riskScore < 0.6)
            riskLevel = 'medium';
        else if (riskScore < 0.8)
            riskLevel = 'high';
        else
            riskLevel = 'critical';
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
exports.MLApiClient = MLApiClient;
exports.mlApiClient = new MLApiClient();
//# sourceMappingURL=mlApiClient.service.js.map