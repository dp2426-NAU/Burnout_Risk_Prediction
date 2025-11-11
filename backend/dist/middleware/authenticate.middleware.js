"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRequest = authenticateRequest;
const auth_service_1 = require("../services/auth.service");
const logger_1 = require("../utils/logger");
function authenticateRequest(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required'
            });
            return;
        }
        const decoded = (0, auth_service_1.verifyToken)(token);
        if (!decoded) {
            res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        logger_1.logger.error('Error authenticating request', error);
        res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
}
//# sourceMappingURL=authenticate.middleware.js.map