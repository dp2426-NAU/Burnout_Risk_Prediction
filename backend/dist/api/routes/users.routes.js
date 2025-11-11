"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_model_1 = require("../../models/user.model");
const authenticate_middleware_1 = require("../../middleware/authenticate.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
router.use(authenticate_middleware_1.authenticateRequest);
router.use((0, rbac_middleware_1.requireRole)([rbac_middleware_1.ROLES.ADMIN, rbac_middleware_1.ROLES.MANAGER]));
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