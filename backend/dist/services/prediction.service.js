"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePrediction = generatePrediction;
exports.getLatestPrediction = getLatestPrediction;
exports.getPredictionHistory = getPredictionHistory;
const predictionResult_model_1 = require("../models/predictionResult.model");
const featureExtractor_1 = require("../utils/featureExtractor");
const logger_1 = require("../utils/logger");
const mlApiClient_service_1 = require("./mlApiClient.service");
async function generatePrediction(request) {
    try {
        const { userId, startDate, endDate, additionalData } = request;
        const features = await (0, featureExtractor_1.extractAllFeatures)(userId, startDate, endDate);
        if (additionalData) {
            if (additionalData.sleepQuality !== undefined) {
                features.sleepQuality = additionalData.sleepQuality;
            }
            if (additionalData.exerciseFrequency !== undefined) {
                features.exerciseFrequency = additionalData.exerciseFrequency;
            }
            if (additionalData.nutritionQuality !== undefined) {
                features.nutritionQuality = additionalData.nutritionQuality;
            }
            if (additionalData.socialSupport !== undefined) {
                features.socialInteraction = additionalData.socialSupport;
            }
            if (additionalData.jobSatisfaction !== undefined) {
                features.workLifeBalance = additionalData.jobSatisfaction;
            }
        }
        const mlPrediction = await mlApiClient_service_1.mlApiClient.predictBurnoutRisk(userId, features, 'latest');
        const riskScore = mlPrediction.riskScore;
        const riskLevel = mlPrediction.riskLevel;
        const confidence = mlPrediction.confidence;
        const recommendations = convertMLRecommendations(features, riskLevel);
        const prediction = new predictionResult_model_1.PredictionResult({
            userId: userId,
            predictionDate: new Date(),
            riskLevel,
            riskScore,
            confidence,
            factors: {
                workload: features.workloadLevel,
                stressLevel: features.stressLevel,
                workLifeBalance: features.workLifeBalance,
                socialSupport: features.socialInteraction,
                jobSatisfaction: features.workLifeBalance,
                physicalHealth: features.exerciseFrequency,
                mentalHealth: features.sleepQuality,
                sleepQuality: features.sleepQuality,
                exerciseFrequency: features.exerciseFrequency,
                nutritionQuality: features.nutritionQuality
            },
            recommendations,
            dataPoints: {
                calendarEvents: features.totalEvents,
                emailMessages: features.emailCount,
                surveyResponses: 0,
                biometricData: 0
            },
            modelVersion: 'baseline'
        });
        await prediction.save();
        logger_1.logger.info(`Prediction generated for user ${userId}: Risk Level ${riskLevel}, Score ${riskScore}`);
        return {
            success: true,
            prediction
        };
    }
    catch (error) {
        logger_1.logger.error('Error generating prediction:', error);
        return {
            success: false,
            message: 'Failed to generate prediction. Please try again.'
        };
    }
}
function convertMLRecommendations(features, riskLevel) {
    const recommendations = [];
    try {
        if (features.workloadLevel > 3) {
            recommendations.push({
                priority: 'high',
                category: 'workload',
                title: 'Reduce Workload',
                description: 'Your workload is significantly high. Consider delegating tasks or discussing workload distribution with your manager.',
                actionItems: [
                    'Review your current tasks and identify what can be delegated',
                    'Schedule a meeting with your manager to discuss workload',
                    'Break down large tasks into smaller, manageable chunks',
                    'Set realistic deadlines for your projects'
                ],
                resources: [
                    'https://example.com/workload-management-guide',
                    'https://example.com/delegation-tips'
                ]
            });
        }
        if (features.stressLevel > 3) {
            recommendations.push({
                priority: 'high',
                category: 'stress',
                title: 'Introduce Recovery Blocks',
                description: 'Stress indicators are elevated. Use micro-breaks and recovery routines to reset before critical work.',
                actionItems: [
                    'Schedule two 15-minute recovery breaks each day',
                    'Practice guided breathing exercises after intense meetings',
                    'Block calendar time for focused, interruption-free work'
                ]
            });
        }
        if (features.sleepQuality < 4 || features.exerciseFrequency < 3) {
            recommendations.push({
                priority: 'medium',
                category: 'health',
                title: 'Improve Regenerative Habits',
                description: 'Sleep quality and movement habits influence resilience. Incremental improvements will reduce burnout risk.',
                actionItems: [
                    'Set a consistent lights-out routine',
                    'Take a 10-minute walk between meetings',
                    'Avoid screen time 30 minutes before sleep'
                ]
            });
        }
        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'medium',
                category: 'lifestyle',
                title: 'Maintain Current Practices',
                description: 'Continue monitoring your well-being and make adjustments as needed.',
                actionItems: [
                    'Continue regular self-assessment',
                    'Stay aware of stress indicators',
                    'Maintain work-life boundaries',
                    'Keep up with current healthy habits'
                ]
            });
        }
        return recommendations;
    }
    catch (error) {
        logger_1.logger.error('Error converting ML recommendations:', error);
        return [{
                priority: 'medium',
                category: 'lifestyle',
                title: 'General Well-being',
                description: 'Focus on maintaining a healthy work-life balance and managing stress effectively.',
                actionItems: [
                    'Take regular breaks',
                    'Maintain healthy sleep habits',
                    'Stay connected with colleagues and friends',
                    'Monitor your stress levels'
                ]
            }];
    }
}
async function getLatestPrediction(userId) {
    try {
        const prediction = await predictionResult_model_1.PredictionResult.findLatestByUser(userId);
        return prediction;
    }
    catch (error) {
        logger_1.logger.error('Error getting latest prediction:', error);
        return null;
    }
}
async function getPredictionHistory(userId, limit = 10) {
    try {
        const predictions = await predictionResult_model_1.PredictionResult.find({ userId })
            .sort({ predictionDate: -1 })
            .limit(limit);
        return predictions;
    }
    catch (error) {
        logger_1.logger.error('Error getting prediction history:', error);
        return [];
    }
}
//# sourceMappingURL=prediction.service.js.map