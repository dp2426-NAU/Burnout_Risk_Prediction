"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateBurnoutRisk = exports.getProfileOverview = exports.getEmployeeDashboardById = exports.getEmployeeDashboard = void 0;
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const user_model_1 = require("../models/user.model");
const csvData_service_1 = require("../services/csvData.service");
const logger_1 = require("../utils/logger");
const getEmployeeDashboard = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const targetUserId = req.query.userId;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;
        let userIdToFetch;
        if (targetUserId) {
            if (requesterRole === rbac_middleware_1.ROLES.USER && requesterId !== targetUserId) {
                logger_1.logger.warn(`Access denied: Employee ${requesterId} trying to access ${targetUserId}`);
                res.status(403).json({
                    success: false,
                    message: 'Access denied - insufficient permissions'
                });
                return;
            }
            if (requesterRole === rbac_middleware_1.ROLES.MANAGER || requesterRole === rbac_middleware_1.ROLES.ADMIN) {
                userIdToFetch = targetUserId;
            }
            else {
                userIdToFetch = requesterId;
            }
        }
        else {
            userIdToFetch = requesterId;
        }
        const user = await user_model_1.User.findById(userIdToFetch);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (!(0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, userIdToFetch, user.managerId?.toString() || null)) {
            logger_1.logger.warn(`Access denied: User ${requesterId} (${requesterRole}) trying to access ${userIdToFetch}`);
            res.status(403).json({
                success: false,
                message: 'Access denied - insufficient permissions'
            });
            return;
        }
        const employeeData = (0, csvData_service_1.getEmployeeData)(user.employeeId, user.employeeName || `${user.firstName} ${user.lastName}`);
        if (!employeeData) {
            res.status(404).json({
                success: false,
                message: 'Employee data not found in CSV datasets'
            });
            return;
        }
        const dailySummary = (0, csvData_service_1.calculateDailySummary)(employeeData);
        const riskScore = calculateRiskScore(employeeData);
        const riskLevel = getRiskLevel(riskScore);
        const recommendations = generateRecommendations(riskLevel, employeeData);
        res.status(200).json({
            success: true,
            data: {
                userId: user._id.toString(),
                profile: {
                    name: `${user.firstName} ${user.lastName}`,
                    jobTitle: user.jobTitle || employeeData.jobRole || 'Employee',
                    department: user.department || employeeData.department,
                    role: user.role
                },
                dailySummary,
                riskLevel,
                riskScore: Math.round(riskScore * 100),
                confidence: 0.85,
                factors: {
                    workload: normalizeFactor(employeeData.workHoursPerWeek, 40, 70),
                    stressLevel: normalizeFactor(employeeData.stressLevel, 0, 10),
                    workLifeBalance: normalizeFactor(employeeData.workLifeBalanceScore, 0, 10),
                    socialSupport: 7,
                    jobSatisfaction: normalizeFactor(employeeData.jobSatisfaction || employeeData.satisfactionLevel, 0, 10),
                    physicalHealth: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
                    mentalHealth: normalizeFactor(employeeData.stressLevel, 0, 10),
                    sleepQuality: normalizeFactor(employeeData.sleepHours, 4, 9),
                    exerciseFrequency: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
                    nutritionQuality: 6
                },
                recommendations,
                workPatterns: {
                    workHoursPerWeek: employeeData.workHoursPerWeek || 40,
                    meetingHoursPerWeek: dailySummary.meetingsAttended * 5,
                    emailCountPerDay: dailySummary.emailsResponded,
                    stressLevel: employeeData.stressLevel || 5,
                    workloadScore: normalizeFactor(employeeData.workHoursPerWeek, 40, 70),
                    workLifeBalance: normalizeFactor(employeeData.workLifeBalanceScore, 0, 10),
                    teamSize: employeeData.teamSize,
                    remoteWorkPercentage: employeeData.remoteRatio || 0,
                    overtimeHours: Math.max(0, (employeeData.workHoursPerWeek || 40) - 40),
                    deadlinePressure: normalizeFactor(employeeData.stressLevel, 0, 10),
                    sleepQuality: normalizeFactor(employeeData.sleepHours, 4, 9),
                    exerciseFrequency: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
                    nutritionQuality: 6,
                    socialSupport: 7,
                    jobSatisfaction: normalizeFactor(employeeData.jobSatisfaction || employeeData.satisfactionLevel, 0, 10)
                },
                employeeData
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in getEmployeeDashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getEmployeeDashboard = getEmployeeDashboard;
const getEmployeeDashboardById = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const targetUserId = req.params.userId;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;
        if (requesterRole !== rbac_middleware_1.ROLES.MANAGER && requesterRole !== rbac_middleware_1.ROLES.ADMIN) {
            res.status(403).json({
                success: false,
                message: 'Access denied - manager or admin role required'
            });
            return;
        }
        const user = await user_model_1.User.findById(targetUserId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (!(0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, targetUserId, user.managerId?.toString() || null)) {
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
            return;
        }
        const employeeData = (0, csvData_service_1.getEmployeeData)(user.employeeId, user.employeeName || `${user.firstName} ${user.lastName}`);
        if (!employeeData) {
            res.status(404).json({
                success: false,
                message: 'Employee data not found in CSV datasets'
            });
            return;
        }
        const dailySummary = (0, csvData_service_1.calculateDailySummary)(employeeData);
        const riskScore = calculateRiskScore(employeeData);
        const riskLevel = getRiskLevel(riskScore);
        const recommendations = generateRecommendations(riskLevel, employeeData);
        res.status(200).json({
            success: true,
            data: {
                userId: user._id.toString(),
                profile: {
                    name: `${user.firstName} ${user.lastName}`,
                    jobTitle: user.jobTitle || employeeData.jobRole || 'Employee',
                    department: user.department || employeeData.department,
                    role: user.role
                },
                dailySummary,
                riskLevel,
                riskScore: Math.round(riskScore * 100),
                confidence: 0.85,
                factors: {
                    workload: normalizeFactor(employeeData.workHoursPerWeek, 40, 70),
                    stressLevel: normalizeFactor(employeeData.stressLevel, 0, 10),
                    workLifeBalance: normalizeFactor(employeeData.workLifeBalanceScore, 0, 10),
                    socialSupport: 7,
                    jobSatisfaction: normalizeFactor(employeeData.jobSatisfaction || employeeData.satisfactionLevel, 0, 10),
                    physicalHealth: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
                    mentalHealth: normalizeFactor(employeeData.stressLevel, 0, 10),
                    sleepQuality: normalizeFactor(employeeData.sleepHours, 4, 9),
                    exerciseFrequency: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
                    nutritionQuality: 6
                },
                recommendations,
                workPatterns: {
                    workHoursPerWeek: employeeData.workHoursPerWeek || 40,
                    meetingHoursPerWeek: dailySummary.meetingsAttended * 5,
                    emailCountPerDay: dailySummary.emailsResponded,
                    stressLevel: employeeData.stressLevel || 5,
                    workloadScore: normalizeFactor(employeeData.workHoursPerWeek, 40, 70),
                    workLifeBalance: normalizeFactor(employeeData.workLifeBalanceScore, 0, 10),
                    teamSize: employeeData.teamSize,
                    remoteWorkPercentage: employeeData.remoteRatio || 0,
                    overtimeHours: Math.max(0, (employeeData.workHoursPerWeek || 40) - 40),
                    deadlinePressure: normalizeFactor(employeeData.stressLevel, 0, 10),
                    sleepQuality: normalizeFactor(employeeData.sleepHours, 4, 9),
                    exerciseFrequency: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
                    nutritionQuality: 6,
                    socialSupport: 7,
                    jobSatisfaction: normalizeFactor(employeeData.jobSatisfaction || employeeData.satisfactionLevel, 0, 10)
                },
                employeeData
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in getEmployeeDashboardById:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getEmployeeDashboardById = getEmployeeDashboardById;
const getProfileOverview = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const targetUserId = req.query.userId;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;
        let userIdToFetch;
        if (targetUserId) {
            if (requesterRole === rbac_middleware_1.ROLES.USER && requesterId !== targetUserId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }
            if (requesterRole === rbac_middleware_1.ROLES.MANAGER || requesterRole === rbac_middleware_1.ROLES.ADMIN) {
                userIdToFetch = targetUserId;
            }
            else {
                userIdToFetch = requesterId;
            }
        }
        else {
            userIdToFetch = requesterId;
        }
        const user = await user_model_1.User.findById(userIdToFetch);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (!(0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, userIdToFetch, user.managerId?.toString() || null)) {
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
            return;
        }
        const employeeData = (0, csvData_service_1.getEmployeeData)(user.employeeId, user.employeeName || `${user.firstName} ${user.lastName}`);
        if (!employeeData) {
            res.status(404).json({
                success: false,
                message: 'Employee data not found'
            });
            return;
        }
        const dailySummary = (0, csvData_service_1.calculateDailySummary)(employeeData);
        res.status(200).json({
            success: true,
            data: {
                profile: {
                    name: `${user.firstName} ${user.lastName}`,
                    jobTitle: user.jobTitle || employeeData.jobRole || 'Employee',
                    department: user.department || employeeData.department,
                    role: user.role
                },
                dailySummary
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in getProfileOverview:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getProfileOverview = getProfileOverview;
const simulateBurnoutRisk = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const { meetingHours, workHours, sleepHours, stressLevel, workLifeBalance, exerciseFrequency, userId: targetUserId } = req.body;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;
        let userIdToFetch;
        if (targetUserId) {
            if (requesterRole === rbac_middleware_1.ROLES.USER && requesterId !== targetUserId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied - you can only simulate your own risk'
                });
                return;
            }
            if (requesterRole === rbac_middleware_1.ROLES.MANAGER || requesterRole === rbac_middleware_1.ROLES.ADMIN) {
                userIdToFetch = targetUserId;
            }
            else {
                userIdToFetch = requesterId;
            }
        }
        else {
            userIdToFetch = requesterId;
        }
        const user = await user_model_1.User.findById(userIdToFetch);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (!(0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, userIdToFetch, user.managerId?.toString() || null)) {
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
            return;
        }
        const employeeData = (0, csvData_service_1.getEmployeeData)(user.employeeId, user.employeeName || `${user.firstName} ${user.lastName}`);
        if (!employeeData) {
            res.status(404).json({
                success: false,
                message: 'Employee data not found'
            });
            return;
        }
        const baseRiskScore = calculateRiskScore(employeeData);
        const baseWorkHours = employeeData.workHoursPerWeek || 40;
        const baseSleepHours = employeeData.sleepHours || 7;
        const baseStressLevel = employeeData.stressLevel || 5;
        const baseWorkLifeBalance = normalizeFactor(employeeData.workLifeBalanceScore, 0, 10);
        const baseExerciseFrequency = normalizeFactor(employeeData.physicalActivityHrs, 0, 10);
        const simulatedWorkHoursPerWeek = workHours !== undefined
            ? (workHours <= 24 ? workHours * 5 : workHours)
            : baseWorkHours;
        const deltaWorkHours = workHours !== undefined ? (simulatedWorkHoursPerWeek - baseWorkHours) / 30 : 0;
        const deltaSleepHours = sleepHours !== undefined ? (sleepHours - baseSleepHours) / 5 : 0;
        const deltaStressLevel = stressLevel !== undefined ? (stressLevel - baseStressLevel) / 5 : 0;
        const deltaWorkLifeBalance = workLifeBalance !== undefined ? (workLifeBalance - baseWorkLifeBalance) / 5 : 0;
        const deltaExerciseFrequency = exerciseFrequency !== undefined ? (exerciseFrequency - baseExerciseFrequency) / 5 : 0;
        const deltaMeetingHours = meetingHours !== undefined ? (meetingHours - (baseWorkHours * 0.15)) / 20 : 0;
        const newRiskScore = Math.max(0, Math.min(1, baseRiskScore +
            (deltaWorkHours * 0.15) +
            (deltaMeetingHours * 0.15) -
            (deltaSleepHours * 0.2) +
            (deltaStressLevel * 0.25) -
            (deltaWorkLifeBalance * 0.1) -
            (deltaExerciseFrequency * 0.05)));
        const newRiskLevel = getRiskLevel(newRiskScore);
        const recommendations = generateSimulationRecommendations(newRiskLevel, {
            meetingHours,
            workHours: simulatedWorkHoursPerWeek,
            sleepHours,
            stressLevel,
            workLifeBalance,
            exerciseFrequency
        }, {
            baseWorkHours,
            baseSleepHours,
            baseStressLevel,
            baseWorkLifeBalance,
            baseExerciseFrequency
        });
        res.status(200).json({
            success: true,
            data: {
                baseRiskScore: Math.round(baseRiskScore * 100),
                baseRiskLevel: getRiskLevel(baseRiskScore),
                simulatedRiskScore: Math.round(newRiskScore * 100),
                simulatedRiskLevel: newRiskLevel,
                changes: {
                    riskScoreChange: Math.round((newRiskScore - baseRiskScore) * 100),
                    riskLevelChange: newRiskLevel !== getRiskLevel(baseRiskScore)
                },
                recommendations
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in simulateBurnoutRisk:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.simulateBurnoutRisk = simulateBurnoutRisk;
function normalizeFactor(value, min, max) {
    if (value === undefined || value === null)
        return 5;
    return Math.max(0, Math.min(10, ((value - min) / (max - min)) * 10));
}
function calculateRiskScore(employeeData) {
    const workHoursPerWeek = employeeData.workHoursPerWeek || 40;
    const stressLevel = normalizeFactor(employeeData.stressLevel, 0, 10);
    const workLifeBalance = normalizeFactor(employeeData.workLifeBalanceScore, 0, 10);
    const sleepHours = normalizeFactor(employeeData.sleepHours, 4, 9);
    const exerciseFrequency = normalizeFactor(employeeData.physicalActivityHrs, 0, 10);
    const jobSatisfaction = normalizeFactor(employeeData.jobSatisfaction || employeeData.satisfactionLevel, 0, 10);
    const riskFactors = [
        ((workHoursPerWeek - 40) / 30) * 0.15,
        (stressLevel - 5) / 5 * 0.2,
        (5 - workLifeBalance) / 5 * 0.15,
        (5 - sleepHours) / 5 * 0.1,
        (5 - exerciseFrequency) / 5 * 0.05,
        (5 - jobSatisfaction) / 5 * 0.1
    ];
    const riskScore = riskFactors.reduce((sum, factor) => sum + factor, 0.3);
    return Math.max(0, Math.min(1, riskScore));
}
function getRiskLevel(riskScore) {
    if (riskScore < 0.3)
        return 'low';
    if (riskScore < 0.6)
        return 'medium';
    if (riskScore < 0.8)
        return 'high';
    return 'critical';
}
function generateRecommendations(riskLevel, employeeData) {
    const recommendations = [];
    if (riskLevel === 'low') {
        recommendations.push({
            priority: 'low',
            category: 'health',
            title: 'Continue Healthy Habits',
            description: 'Keep maintaining your current work-life balance and stress management practices.',
            actionItems: ['Continue current routine', 'Monitor stress levels', 'Maintain work boundaries']
        });
    }
    else if (riskLevel === 'medium') {
        recommendations.push({
            priority: 'medium',
            category: 'workload',
            title: 'Reduce Workload Pressure',
            description: 'Consider reducing your workload or improving time management to prevent burnout.',
            actionItems: ['Prioritize tasks', 'Delegate when possible', 'Set realistic deadlines']
        });
    }
    else if (riskLevel === 'high') {
        recommendations.push({
            priority: 'high',
            category: 'stress',
            title: 'Immediate Stress Reduction',
            description: 'Your stress levels are concerning. Take immediate action to reduce pressure.',
            actionItems: ['Take time off', 'Reduce work hours', 'Seek support from manager']
        });
    }
    else {
        recommendations.push({
            priority: 'high',
            category: 'health',
            title: 'Critical Intervention Needed',
            description: 'You are at high risk of burnout. Immediate intervention is required.',
            actionItems: ['Contact HR immediately', 'Take extended leave', 'Seek professional help']
        });
    }
    if (employeeData.workHoursPerWeek && employeeData.workHoursPerWeek > 50) {
        recommendations.push({
            priority: 'high',
            category: 'workload',
            title: 'Reduce Work Hours',
            description: `You're working ${employeeData.workHoursPerWeek} hours per week. Consider reducing to 40-45 hours.`,
            actionItems: ['Set work hour limits', 'Avoid overtime', 'Improve efficiency']
        });
    }
    if (employeeData.stressLevel && employeeData.stressLevel > 7) {
        recommendations.push({
            priority: 'high',
            category: 'stress',
            title: 'Stress Management',
            description: 'Your stress level is high. Implement stress reduction techniques.',
            actionItems: ['Practice meditation', 'Take regular breaks', 'Exercise regularly']
        });
    }
    if (employeeData.workLifeBalanceScore && employeeData.workLifeBalanceScore < 4) {
        recommendations.push({
            priority: 'medium',
            category: 'lifestyle',
            title: 'Improve Work-Life Balance',
            description: 'Your work-life balance needs attention. Set clear boundaries.',
            actionItems: ['Set work hours', 'Avoid after-hours emails', 'Schedule personal time']
        });
    }
    return recommendations;
}
function generateSimulationRecommendations(riskLevel, simulated, base) {
    const recommendations = [];
    if (simulated.sleepHours && simulated.sleepHours > base.baseSleepHours) {
        recommendations.push({
            priority: 'low',
            category: 'health',
            title: 'Sleep Improvement',
            description: `Increasing sleep from ${base.baseSleepHours} to ${simulated.sleepHours} hours will help reduce burnout risk.`,
            actionItems: ['Maintain consistent sleep schedule', 'Create bedtime routine', 'Limit screen time before bed']
        });
    }
    if (simulated.workHours && simulated.workHours < base.baseWorkHours) {
        recommendations.push({
            priority: 'medium',
            category: 'workload',
            title: 'Work Hours Reduction',
            description: `Reducing work hours from ${base.baseWorkHours} to ${simulated.workHours} hours per week will lower burnout risk.`,
            actionItems: ['Set clear work boundaries', 'Prioritize essential tasks', 'Delegate non-critical work']
        });
    }
    if (simulated.stressLevel && simulated.stressLevel < base.baseStressLevel) {
        recommendations.push({
            priority: 'high',
            category: 'stress',
            title: 'Stress Reduction',
            description: `Reducing stress level from ${base.baseStressLevel} to ${simulated.stressLevel} will significantly improve your wellbeing.`,
            actionItems: ['Practice mindfulness', 'Take regular breaks', 'Seek support when needed']
        });
    }
    if (riskLevel === 'high' || riskLevel === 'critical') {
        recommendations.push({
            priority: 'high',
            category: 'health',
            title: 'Immediate Action Required',
            description: 'Your simulated risk level indicates immediate intervention is needed.',
            actionItems: ['Consult with HR', 'Consider taking time off', 'Seek professional support']
        });
    }
    return recommendations;
}
//# sourceMappingURL=dashboard.controller.js.map