"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_model_1 = require("../../models/user.model");
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
        req.user = { id: 'temp' };
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
        const users = await user_model_1.User.find({}, { password: 0 }).sort({ createdAt: -1 });
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