"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../../models/user.model");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const auth_service_1 = require("../../services/auth.service");
const router = (0, express_1.Router)();
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }
        const decoded = (0, auth_service_1.verifyToken)(token);
        if (!decoded) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
};
router.use(authenticateToken);
router.get('/', async (req, res) => {
    try {
        const requesterRole = req.user?.role;
        const requesterId = req.user?.userId;
        let query = {};
        if (requesterRole === rbac_middleware_1.ROLES.ADMIN) {
        }
        else if (requesterRole === rbac_middleware_1.ROLES.MANAGER) {
            const manager = await user_model_1.User.findById(requesterId);
            if (!manager) {
                res.status(404).json({
                    success: false,
                    message: 'Manager not found'
                });
                return;
            }
            const managerDepartment = manager.department;
            const requesterObjectId = new mongoose_1.default.Types.ObjectId(requesterId);
            query = {
                $or: [
                    { _id: requesterObjectId },
                    {
                        department: managerDepartment,
                        role: 'user'
                    }
                ]
            };
        }
        else {
            query = { _id: new mongoose_1.default.Types.ObjectId(requesterId) };
        }
        const users = await user_model_1.User.find(query, { password: 0 })
            .populate('managerId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const user = await user_model_1.User.findById(req.params.id, { password: 0 });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        return res.json(user);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.routes.js.map