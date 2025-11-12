"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
describe('Access Control - canAccessEmployeeDataSync', () => {
    describe('Employee (user) access', () => {
        it('should allow employee to access their own data', () => {
            const requesterId = 'user123';
            const requesterRole = rbac_middleware_1.ROLES.USER;
            const targetUserId = 'user123';
            const result = (0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, targetUserId, null);
            expect(result).toBe(true);
        });
        it('should deny employee access to another employee\'s data', () => {
            const requesterId = 'user123';
            const requesterRole = rbac_middleware_1.ROLES.USER;
            const targetUserId = 'user456';
            const result = (0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, targetUserId, null);
            expect(result).toBe(false);
        });
    });
    describe('Manager access', () => {
        it('should allow manager to access their direct report\'s data', () => {
            const requesterId = 'manager123';
            const requesterRole = rbac_middleware_1.ROLES.MANAGER;
            const targetUserId = 'user456';
            const targetUserManagerId = 'manager123';
            const result = (0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, targetUserId, targetUserManagerId);
            expect(result).toBe(true);
        });
        it('should deny manager access to employee not under them', () => {
            const requesterId = 'manager123';
            const requesterRole = rbac_middleware_1.ROLES.MANAGER;
            const targetUserId = 'user456';
            const targetUserManagerId = 'manager999';
            const result = (0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, targetUserId, targetUserManagerId);
            expect(result).toBe(false);
        });
        it('should allow manager to access their own data', () => {
            const requesterId = 'manager123';
            const requesterRole = rbac_middleware_1.ROLES.MANAGER;
            const targetUserId = 'manager123';
            const result = (0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, targetUserId, null);
            expect(result).toBe(true);
        });
    });
    describe('Admin access', () => {
        it('should allow admin to access any employee\'s data', () => {
            const requesterId = 'admin123';
            const requesterRole = rbac_middleware_1.ROLES.ADMIN;
            const targetUserId = 'user456';
            const result = (0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, targetUserId, null);
            expect(result).toBe(true);
        });
        it('should allow admin to access manager\'s data', () => {
            const requesterId = 'admin123';
            const requesterRole = rbac_middleware_1.ROLES.ADMIN;
            const targetUserId = 'manager123';
            const result = (0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, targetUserId, null);
            expect(result).toBe(true);
        });
        it('should allow admin to access their own data', () => {
            const requesterId = 'admin123';
            const requesterRole = rbac_middleware_1.ROLES.ADMIN;
            const targetUserId = 'admin123';
            const result = (0, rbac_middleware_1.canAccessEmployeeDataSync)(requesterId, requesterRole, targetUserId, null);
            expect(result).toBe(true);
        });
    });
});
//# sourceMappingURL=rbac.middleware.test.js.map