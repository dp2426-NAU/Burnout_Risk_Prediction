"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEmployeeOverview = buildEmployeeOverview;
exports.simulateBurnout = simulateBurnout;
exports.buildManagerOverview = buildManagerOverview;
exports.fetchEmployeeInsights = fetchEmployeeInsights;
exports.fetchModelOperations = fetchModelOperations;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
const predictionResult_model_1 = require("../models/predictionResult.model");
const calendarEvent_model_1 = require("../models/calendarEvent.model");
const emailMessage_model_1 = require("../models/emailMessage.model");
const featureExtractor_1 = require("../utils/featureExtractor");
const mlApiClient_service_1 = require("./mlApiClient.service");
const logger_1 = require("../utils/logger");
const HOURS_IN_MS = 60 * 60 * 1000;
function toObjectId(userId) {
    return new mongoose_1.Types.ObjectId(userId);
}
function startOfDay(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
}
function endOfDay(date) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
}
function normaliseRiskScore(score) {
    return score <= 1 ? Math.round(score * 100) : Math.round(score);
}
async function buildEmployeeOverview(userId) {
    const objectId = toObjectId(userId);
    const user = await user_model_1.User.findById(objectId).lean();
    if (!user) {
        throw new Error('User not found');
    }
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const [events, emails, latestPrediction, recentPredictions] = await Promise.all([
        calendarEvent_model_1.CalendarEvent.findByUserAndDateRange(objectId, todayStart, todayEnd),
        emailMessage_model_1.EmailMessage.findByUserAndDateRange(objectId, todayStart, todayEnd),
        predictionResult_model_1.PredictionResult.findLatestByUser(objectId),
        predictionResult_model_1.PredictionResult.find({ userId: objectId, isActive: true })
            .sort({ predictionDate: -1 })
            .limit(14),
    ]);
    const dailySummary = {
        meetingsAttended: events.filter(event => event.eventType === 'meeting').length,
        emailsResponded: emails.filter(email => email.isOutgoing).length,
        workHours: Number((events.reduce((total, event) => {
            return total + (event.endTime.getTime() - event.startTime.getTime()) / HOURS_IN_MS;
        }, 0)).toFixed(2)),
    };
    const riskSnapshot = latestPrediction
        ? {
            riskLevel: latestPrediction.riskLevel,
            riskScore: latestPrediction.riskScore,
            confidence: latestPrediction.confidence,
            updatedAt: latestPrediction.predictionDate.toISOString(),
            recommendations: latestPrediction.recommendations,
        }
        : null;
    const history = recentPredictions
        .map((prediction) => ({
        date: prediction.predictionDate.toISOString().split('T')[0],
        riskScore: prediction.riskScore,
        riskLevel: prediction.riskLevel,
        confidence: prediction.confidence,
    }))
        .reverse();
    return {
        profile: {
            id: user._id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            jobTitle: user.jobTitle,
            department: user.department,
            experienceYears: user.experienceYears,
        },
        dailySummary,
        riskSnapshot,
        history,
    };
}
async function simulateBurnout(userId, adjustments) {
    const objectId = toObjectId(userId);
    const rangeEnd = new Date();
    const rangeStart = new Date(rangeEnd.getTime() - 7 * 24 * HOURS_IN_MS);
    const [baseFeatures, latestPrediction] = await Promise.all([
        (0, featureExtractor_1.extractAllFeatures)(userId, rangeStart, rangeEnd),
        predictionResult_model_1.PredictionResult.findLatestByUser(objectId),
    ]);
    const originalFeatures = { ...baseFeatures };
    if (typeof adjustments.meetingHours === 'number') {
        baseFeatures.meetingDuration = adjustments.meetingHours;
    }
    if (typeof adjustments.workHours === 'number') {
        baseFeatures.workHours = adjustments.workHours;
    }
    if (typeof adjustments.sleepHours === 'number') {
        baseFeatures.sleepQuality = Math.max(0, Math.min(10, adjustments.sleepHours));
    }
    if (typeof adjustments.stressLevel === 'number') {
        baseFeatures.stressLevel = Math.max(0, Math.min(10, adjustments.stressLevel));
    }
    if (typeof adjustments.workloadLevel === 'number') {
        baseFeatures.workloadLevel = Math.max(0, Math.min(10, adjustments.workloadLevel));
    }
    const prediction = await mlApiClient_service_1.mlApiClient.predictBurnoutRisk(userId, baseFeatures, 'latest');
    const adjustedScore = normaliseRiskScore(prediction.riskScore);
    const baselineSummary = latestPrediction
        ? {
            riskLevel: latestPrediction.riskLevel,
            riskScore: latestPrediction.riskScore,
            confidence: latestPrediction.confidence,
        }
        : null;
    const tips = [];
    if (adjustments.meetingHours !== undefined) {
        if (baselineSummary && adjustments.meetingHours < originalFeatures.meetingDuration) {
            tips.push('Reducing meeting load frees focus time—protect no-meeting blocks for deep work.');
        }
        else {
            tips.push('Balance meeting commitments with focus time to avoid context switching fatigue.');
        }
    }
    if (adjustments.sleepHours !== undefined && adjustments.sleepHours < 7) {
        tips.push('Aim for at least 7 hours of sleep to maintain cognitive performance and resilience.');
    }
    if (adjustments.workHours !== undefined && adjustments.workHours > 45) {
        tips.push('Consistently high work hours raise burnout risk—consider scheduling deliberate rest.');
    }
    return {
        baseline: baselineSummary,
        adjusted: {
            riskLevel: prediction.riskLevel,
            riskScore: adjustedScore,
            confidence: prediction.confidence,
        },
        delta: baselineSummary ? adjustedScore - baselineSummary.riskScore : null,
        tips,
    };
}
async function buildManagerOverview() {
    const users = await user_model_1.User.find({ isActive: true }, { password: 0 }).lean();
    const latestPredictions = await predictionResult_model_1.PredictionResult.aggregate([
        { $match: { isActive: true } },
        { $sort: { predictionDate: -1 } },
        {
            $group: {
                _id: '$userId',
                prediction: { $first: '$$ROOT' },
            },
        },
    ]);
    const predictionMap = new Map();
    latestPredictions.forEach((entry) => {
        predictionMap.set(entry._id.toString(), entry.prediction);
    });
    let lowRisk = 0;
    let mediumRisk = 0;
    let highRisk = 0;
    let criticalRisk = 0;
    const departmentMap = new Map();
    users.forEach((user) => {
        const latest = predictionMap.get(user._id.toString());
        if (!latest) {
            return;
        }
        switch (latest.riskLevel) {
            case 'low':
                lowRisk++;
                break;
            case 'medium':
                mediumRisk++;
                break;
            case 'high':
                highRisk++;
                break;
            case 'critical':
                criticalRisk++;
                break;
            default:
                break;
        }
        const department = user.department || 'Unassigned';
        const bucket = departmentMap.get(department) || { totalScore: 0, count: 0 };
        bucket.totalScore += latest.riskScore;
        bucket.count += 1;
        departmentMap.set(department, bucket);
    });
    const departmentDistribution = Array.from(departmentMap.entries()).map(([department, bucket]) => ({
        department,
        averageRiskScore: bucket.count > 0 ? Number((bucket.totalScore / bucket.count).toFixed(2)) : 0,
        employeeCount: bucket.count,
    }));
    const trendResults = await predictionResult_model_1.PredictionResult.aggregate([
        { $match: { isActive: true } },
        { $sort: { predictionDate: -1 } },
        { $limit: 1000 },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$predictionDate' },
                },
                avgRiskScore: { $avg: '$riskScore' },
                avgConfidence: { $avg: '$confidence' },
                riskLevel: { $first: '$riskLevel' },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    const trend = trendResults.map((item) => ({
        date: item._id,
        riskScore: Number(item.avgRiskScore.toFixed(2)),
        riskLevel: item.riskLevel,
        confidence: Number(item.avgConfidence.toFixed(2)),
    }));
    return {
        summary: {
            totalEmployees: users.length,
            lowRisk,
            mediumRisk,
            highRisk,
            criticalRisk,
        },
        departmentDistribution,
        trend,
    };
}
async function fetchEmployeeInsights() {
    const users = await user_model_1.User.find({ isActive: true }, { password: 0 }).lean();
    const latestPredictions = await predictionResult_model_1.PredictionResult.aggregate([
        { $match: { isActive: true } },
        { $sort: { predictionDate: -1 } },
        {
            $group: {
                _id: '$userId',
                prediction: { $first: '$$ROOT' },
            },
        },
    ]);
    const predictionMap = new Map();
    latestPredictions.forEach((entry) => {
        predictionMap.set(entry._id.toString(), entry.prediction);
    });
    return users.map((user) => {
        const prediction = predictionMap.get(user._id.toString());
        return {
            id: user._id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            department: user.department,
            jobTitle: user.jobTitle,
            riskLevel: prediction?.riskLevel || 'unknown',
            riskScore: prediction?.riskScore ?? 0,
            workPatterns: user.workPatterns,
            recommendedActions: prediction?.recommendations ?? [],
        };
    });
}
async function fetchModelOperations() {
    let metrics = null;
    let eda = null;
    try {
        metrics = await mlApiClient_service_1.mlApiClient.fetchTrainingMetrics();
    }
    catch (error) {
        logger_1.logger.warn('Training metrics unavailable from ML service');
    }
    try {
        eda = await mlApiClient_service_1.mlApiClient.fetchEdaReport();
    }
    catch (error) {
        logger_1.logger.warn('EDA report unavailable from ML service');
    }
    return { metrics, eda };
}
//# sourceMappingURL=dashboard.service.js.map