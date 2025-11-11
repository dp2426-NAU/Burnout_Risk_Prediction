"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireManagerOrAdmin = exports.requireAdmin = exports.ROLES = void 0;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
exports.requireOwnResourceOrAdmin = requireOwnResourceOrAdmin;
exports.requireTeamAccess = requireTeamAccess;
exports.getUserPermissions = getUserPermissions;
exports.canUserPerformAction = canUserPerformAction;
const logger_1 = require("../utils/logger");
exports.ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    USER: 'user'
};
const PERMISSIONS = {
    [exports.ROLES.ADMIN]: [
        'users:read',
        'users:write',
        'users:delete',
        'predictions:read',
        'predictions:write',
        'predictions:delete',
        'analytics:read',
        'system:admin',
        'data:export',
        'reports:generate'
    ],
    [exports.ROLES.MANAGER]: [
        'users:read',
        'predictions:read',
        'predictions:write',
        'analytics:read',
        'team:manage',
        'reports:generate'
    ],
    [exports.ROLES.USER]: [
        'predictions:read',
        'profile:read',
        'profile:write'
    ]
};
function hasPermission(userRole, requiredPermission) {
    const userPermissions = PERMISSIONS[userRole] || [];
    return userPermissions.includes(requiredPermission);
}
function hasRole(userRole, requiredRoles) {
    return requiredRoles.includes(userRole);
}
function requirePermission(permission) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                logger_1.logger.warn('Unauthorized access attempt - no user in request');
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const userRole = req.user.role;
            if (!hasPermission(userRole, permission)) {
                logger_1.logger.warn(`Access denied for user ${req.user.email} - insufficient permissions for ${permission}`);
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    required: permission,
                    userRole: userRole
                });
                return;
            }
            logger_1.logger.debug(`Access granted for user ${req.user.email} to ${permission}`);
            next();
        }
        catch (error) {
            logger_1.logger.error('Error in RBAC middleware:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };
}
function requireRole(roles) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                logger_1.logger.warn('Unauthorized access attempt - no user in request');
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const userRole = req.user.role;
            if (!hasRole(userRole, roles)) {
                logger_1.logger.warn(`Access denied for user ${req.user.email} - insufficient role. Required: ${roles.join(', ')}, User role: ${userRole}`);
                res.status(403).json({
                    success: false,
                    message: 'Insufficient role permissions',
                    required: roles,
                    userRole: userRole
                });
                return;
            }
            logger_1.logger.debug(`Role access granted for user ${req.user.email} with role ${userRole}`);
            next();
        }
        catch (error) {
            logger_1.logger.error('Error in role-based middleware:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };
}
exports.requireAdmin = requireRole([exports.ROLES.ADMIN]);
exports.requireManagerOrAdmin = requireRole([exports.ROLES.MANAGER, exports.ROLES.ADMIN]);
function requireOwnResourceOrAdmin(req, res, next) {
    try {
        if (!req.user) {
            logger_1.logger.warn('Unauthorized access attempt - no user in request');
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const userRole = req.user.role;
        const resourceUserId = req.params.userId || req.params.id;
        if (userRole === exports.ROLES.ADMIN) {
            next();
            return;
        }
        if (req.user.userId !== resourceUserId) {
            logger_1.logger.warn(`Access denied for user ${req.user.email} - trying to access resource ${resourceUserId}`);
            res.status(403).json({
                success: false,
                message: 'Access denied - you can only access your own resources'
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in resource access middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}
function requireTeamAccess(req, res, next) {
    try {
        if (!req.user) {
            logger_1.logger.warn('Unauthorized access attempt - no user in request');
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const userRole = req.user.role;
        const resourceUserId = req.params.userId || req.params.id;
        if (userRole === exports.ROLES.ADMIN) {
            next();
            return;
        }
        if (userRole === exports.ROLES.MANAGER) {
            next();
            return;
        }
        if (req.user.userId !== resourceUserId) {
            logger_1.logger.warn(`Access denied for user ${req.user.email} - trying to access resource ${resourceUserId}`);
            res.status(403).json({
                success: false,
                message: 'Access denied - insufficient permissions'
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in team access middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}
function getUserPermissions(role) {
    return PERMISSIONS[role] || [];
}
function canUserPerformAction(role, action) {
    return hasPermission(role, action);
}
//# sourceMappingURL=rbac.middleware.js.map