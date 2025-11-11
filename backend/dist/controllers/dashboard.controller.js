"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelOperations = exports.getEmployeeInsights = exports.getManagerDashboard = exports.simulateEmployeeBurnout = exports.getEmployeeDashboard = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const getEmployeeDashboard = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const overview = await (0, dashboard_service_1.buildEmployeeOverview)(req.user.userId);
        return res.status(200).json({
            success: true,
            data: overview,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unable to load dashboard',
        });
    }
};
exports.getEmployeeDashboard = getEmployeeDashboard;
const simulateEmployeeBurnout = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const adjustments = req.body || {};
        const simulation = await (0, dashboard_service_1.simulateBurnout)(req.user.userId, adjustments);
        return res.status(200).json({
            success: true,
            data: simulation,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Simulation failed',
        });
    }
};
exports.simulateEmployeeBurnout = simulateEmployeeBurnout;
const getManagerDashboard = async (req, res) => {
    try {
        if (!req.user || ![rbac_middleware_1.ROLES.ADMIN, rbac_middleware_1.ROLES.MANAGER].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }
        const overview = await (0, dashboard_service_1.buildManagerOverview)();
        return res.status(200).json({
            success: true,
            data: overview,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unable to load analytics',
        });
    }
};
exports.getManagerDashboard = getManagerDashboard;
const getEmployeeInsights = async (req, res) => {
    try {
        if (!req.user || ![rbac_middleware_1.ROLES.ADMIN, rbac_middleware_1.ROLES.MANAGER].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }
        const insights = await (0, dashboard_service_1.fetchEmployeeInsights)();
        return res.status(200).json({
            success: true,
            data: insights,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unable to fetch employee insights',
        });
    }
};
exports.getEmployeeInsights = getEmployeeInsights;
const getModelOperations = async (req, res) => {
    try {
        if (!req.user || ![rbac_middleware_1.ROLES.ADMIN, rbac_middleware_1.ROLES.MANAGER].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }
        const payload = await (0, dashboard_service_1.fetchModelOperations)();
        return res.status(200).json({
            success: true,
            data: payload,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unable to fetch model metrics',
        });
    }
};
exports.getModelOperations = getModelOperations;
//# sourceMappingURL=dashboard.controller.js.map