// Dashboard access control tests - Tests role-based access control
import { canAccessEmployeeDataSync, ROLES } from '../../middleware/rbac.middleware';

describe('Access Control - canAccessEmployeeDataSync', () => {
  describe('Employee (user) access', () => {
    it('should allow employee to access their own data', () => {
      const requesterId = 'user123';
      const requesterRole = ROLES.USER;
      const targetUserId = 'user123';

      const result = canAccessEmployeeDataSync(requesterId, requesterRole, targetUserId, null);
      expect(result).toBe(true);
    });

    it('should deny employee access to another employee\'s data', () => {
      const requesterId = 'user123';
      const requesterRole = ROLES.USER;
      const targetUserId = 'user456';

      const result = canAccessEmployeeDataSync(requesterId, requesterRole, targetUserId, null);
      expect(result).toBe(false);
    });
  });

  describe('Manager access', () => {
    it('should allow manager to access their direct report\'s data', () => {
      const requesterId = 'manager123';
      const requesterRole = ROLES.MANAGER;
      const targetUserId = 'user456';
      const targetUserManagerId = 'manager123'; // Employee reports to this manager

      const result = canAccessEmployeeDataSync(requesterId, requesterRole, targetUserId, targetUserManagerId);
      expect(result).toBe(true);
    });

    it('should deny manager access to employee not under them', () => {
      const requesterId = 'manager123';
      const requesterRole = ROLES.MANAGER;
      const targetUserId = 'user456';
      const targetUserManagerId = 'manager999'; // Employee reports to different manager

      const result = canAccessEmployeeDataSync(requesterId, requesterRole, targetUserId, targetUserManagerId);
      expect(result).toBe(false);
    });

    it('should allow manager to access their own data', () => {
      const requesterId = 'manager123';
      const requesterRole = ROLES.MANAGER;
      const targetUserId = 'manager123';

      const result = canAccessEmployeeDataSync(requesterId, requesterRole, targetUserId, null);
      expect(result).toBe(true);
    });
  });

  describe('Admin access', () => {
    it('should allow admin to access any employee\'s data', () => {
      const requesterId = 'admin123';
      const requesterRole = ROLES.ADMIN;
      const targetUserId = 'user456';

      const result = canAccessEmployeeDataSync(requesterId, requesterRole, targetUserId, null);
      expect(result).toBe(true);
    });

    it('should allow admin to access manager\'s data', () => {
      const requesterId = 'admin123';
      const requesterRole = ROLES.ADMIN;
      const targetUserId = 'manager123';

      const result = canAccessEmployeeDataSync(requesterId, requesterRole, targetUserId, null);
      expect(result).toBe(true);
    });

    it('should allow admin to access their own data', () => {
      const requesterId = 'admin123';
      const requesterRole = ROLES.ADMIN;
      const targetUserId = 'admin123';

      const result = canAccessEmployeeDataSync(requesterId, requesterRole, targetUserId, null);
      expect(result).toBe(true);
    });
  });
});

