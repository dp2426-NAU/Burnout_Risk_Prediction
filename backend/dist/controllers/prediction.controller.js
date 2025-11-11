"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPredictionStats = exports.getPredictionById = exports.getPredictionHistoryForUser = exports.getLatestUserPrediction = exports.generateNewPrediction = void 0;
const express_validator_1 = require("express-validator");
const prediction_service_1 = require("../services/prediction.service");
const logger_1 = require("../utils/logger");
const generateNewPrediction = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const { startDate, endDate, additionalData } = req.body;
        const result = await (0, prediction_service_1.generatePrediction)({
            userId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            additionalData
        });
        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Prediction generated successfully',
                data: {
                    prediction: {
                        id: result.prediction._id,
                        predictionDate: result.prediction.predictionDate,
                        riskLevel: result.prediction.riskLevel,
                        riskScore: result.prediction.riskScore,
                        confidence: result.prediction.confidence,
                        factors: result.prediction.factors,
                        recommendations: result.prediction.recommendations,
                        dataPoints: result.prediction.dataPoints,
                        modelVersion: result.prediction.modelVersion,
                        isActive: result.prediction.isActive,
                        createdAt: result.prediction.createdAt
                    }
                }
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Error in generateNewPrediction controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.generateNewPrediction = generateNewPrediction;
const getLatestUserPrediction = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const prediction = await (0, prediction_service_1.getLatestPrediction)(userId);
        if (!prediction) {
            res.status(404).json({
                success: false,
                message: 'No prediction found for user'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                prediction: {
                    id: prediction._id,
                    predictionDate: prediction.predictionDate,
                    riskLevel: prediction.riskLevel,
                    riskScore: prediction.riskScore,
                    confidence: prediction.confidence,
                    factors: prediction.factors,
                    recommendations: prediction.recommendations,
                    dataPoints: prediction.dataPoints,
                    modelVersion: prediction.modelVersion,
                    isActive: prediction.isActive,
                    createdAt: prediction.createdAt,
                    updatedAt: prediction.updatedAt
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in getLatestUserPrediction controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getLatestUserPrediction = getLatestUserPrediction;
const getPredictionHistoryForUser = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const limit = parseInt(req.query.limit) || 10;
        const predictions = await (0, prediction_service_1.getPredictionHistory)(userId, limit);
        res.status(200).json({
            success: true,
            data: {
                predictions: predictions.map(prediction => ({
                    id: prediction._id,
                    predictionDate: prediction.predictionDate,
                    riskLevel: prediction.riskLevel,
                    riskScore: prediction.riskScore,
                    confidence: prediction.confidence,
                    factors: prediction.factors,
                    recommendations: prediction.recommendations,
                    dataPoints: prediction.dataPoints,
                    modelVersion: prediction.modelVersion,
                    isActive: prediction.isActive,
                    createdAt: prediction.createdAt
                })),
                count: predictions.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in getPredictionHistoryForUser controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getPredictionHistoryForUser = getPredictionHistoryForUser;
const getPredictionById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const predictionId = req.params.id;
        const prediction = await (0, prediction_service_1.getLatestPrediction)(userId);
        if (!prediction || prediction._id.toString() !== predictionId) {
            res.status(404).json({
                success: false,
                message: 'Prediction not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                prediction: {
                    id: prediction._id,
                    predictionDate: prediction.predictionDate,
                    riskLevel: prediction.riskLevel,
                    riskScore: prediction.riskScore,
                    confidence: prediction.confidence,
                    factors: prediction.factors,
                    recommendations: prediction.recommendations,
                    dataPoints: prediction.dataPoints,
                    modelVersion: prediction.modelVersion,
                    isActive: prediction.isActive,
                    createdAt: prediction.createdAt,
                    updatedAt: prediction.updatedAt
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in getPredictionById controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getPredictionById = getPredictionById;
const getPredictionStats = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const predictions = await (0, prediction_service_1.getPredictionHistory)(userId, 30);
        if (predictions.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No predictions found for user'
            });
            return;
        }
        const totalPredictions = predictions.length;
        const riskLevelCounts = {
            low: predictions.filter(p => p.riskLevel === 'low').length,
            medium: predictions.filter(p => p.riskLevel === 'medium').length,
            high: predictions.filter(p => p.riskLevel === 'high').length,
            critical: predictions.filter(p => p.riskLevel === 'critical').length
        };
        const avgRiskScore = predictions.reduce((sum, p) => sum + p.riskScore, 0) / totalPredictions;
        const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / totalPredictions;
        const latestPrediction = predictions[0];
        res.status(200).json({
            success: true,
            data: {
                statistics: {
                    totalPredictions,
                    riskLevelCounts,
                    avgRiskScore: Math.round(avgRiskScore * 100) / 100,
                    avgConfidence: Math.round(avgConfidence * 100) / 100,
                    latestRiskLevel: latestPrediction.riskLevel,
                    latestRiskScore: latestPrediction.riskScore,
                    latestConfidence: latestPrediction.confidence
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in getPredictionStats controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getPredictionStats = getPredictionStats;
//# sourceMappingURL=prediction.controller.js.map