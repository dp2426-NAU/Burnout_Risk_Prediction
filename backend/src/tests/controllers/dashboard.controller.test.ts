// Dashboard controller simulation tests
import { Request, Response } from 'express';
import { simulateBurnoutRisk } from '../../controllers/dashboard.controller';
import { AuthenticatedRequest } from '../../middleware/rbac.middleware';
import { User } from '../../models/user.model';
import * as csvDataService from '../../services/csvData.service';

jest.mock('../../services/csvData.service');

describe('Dashboard Controller - Simulation', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let employee: any;
  let manager: any;

  beforeEach(async () => {
    await User.deleteMany({});

    employee = await User.create({
      email: 'employee@test.com',
      password: 'password123',
      firstName: 'Employee',
      lastName: 'User',
      role: 'user',
      employeeId: '1001',
      employeeName: 'Employee User'
    });

    manager = await User.create({
      email: 'manager@test.com',
      password: 'password123',
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager',
      employeeId: '2001',
      employeeName: 'Manager User'
    });

    // Assign employee to manager
    employee.managerId = manager._id;
    await employee.save();

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock CSV data
    (csvDataService.getEmployeeData as jest.Mock).mockReturnValue({
      employeeId: '1001',
      name: 'Employee User',
      workHoursPerWeek: 40,
      sleepHours: 7,
      stressLevel: 5,
      workLifeBalanceScore: 6,
      physicalActivityHrs: 3,
      jobSatisfaction: 6
    });
  });

  describe('simulateBurnoutRisk', () => {
    it('should calculate risk score change correctly', async () => {
      mockReq = {
        user: {
          userId: employee._id.toString(),
          email: 'employee@test.com',
          role: 'user'
        },
        body: {
          meetingHours: 2,
          workHours: 8,
          sleepHours: 8,
          stressLevel: 4,
          workLifeBalance: 7,
          exerciseFrequency: 6
        }
      };

      await simulateBurnoutRisk(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      
      const responseData = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.baseRiskScore).toBeDefined();
      expect(responseData.data.simulatedRiskScore).toBeDefined();
      expect(responseData.data.changes.riskScoreChange).toBeDefined();
      expect(responseData.data.recommendations).toBeDefined();
    });

    it('should show risk reduction when sleep hours increase', async () => {
      mockReq = {
        user: {
          userId: employee._id.toString(),
          email: 'employee@test.com',
          role: 'user'
        },
        body: {
          sleepHours: 9 // Increased from 7
        }
      };

      await simulateBurnoutRisk(mockReq as AuthenticatedRequest, mockRes as Response);

      const responseData = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseData.data.simulatedRiskScore).toBeLessThanOrEqual(responseData.data.baseRiskScore);
    });

    it('should show risk increase when work hours increase', async () => {
      mockReq = {
        user: {
          userId: employee._id.toString(),
          email: 'employee@test.com',
          role: 'user'
        },
        body: {
          workHours: 10 // Increased from 8 (40 hours/week)
        }
      };

      await simulateBurnoutRisk(mockReq as AuthenticatedRequest, mockRes as Response);

      const responseData = (mockRes.json as jest.Mock).mock.calls[0][0];
      // Risk should increase or stay the same
      expect(responseData.data.simulatedRiskScore).toBeGreaterThanOrEqual(responseData.data.baseRiskScore);
    });

    it('should generate recommendations based on simulation', async () => {
      mockReq = {
        user: {
          userId: employee._id.toString(),
          email: 'employee@test.com',
          role: 'user'
        },
        body: {
          sleepHours: 9,
          workHours: 7
        }
      };

      await simulateBurnoutRisk(mockReq as AuthenticatedRequest, mockRes as Response);

      const responseData = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseData.data.recommendations).toBeDefined();
      expect(Array.isArray(responseData.data.recommendations)).toBe(true);
    });

    it('should allow manager to simulate for their direct report', async () => {
      mockReq = {
        user: {
          userId: manager._id.toString(),
          email: 'manager@test.com',
          role: 'manager'
        },
        body: {
          userId: employee._id.toString(),
          sleepHours: 8
        }
      };

      await simulateBurnoutRisk(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseData.success).toBe(true);
    });

    it('should deny manager from simulating employee not under them', async () => {
      const otherEmployee = await User.create({
        email: 'other@test.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'Employee',
        role: 'user',
        employeeId: '1002',
        managerId: null // Not assigned to this manager
      });

      mockReq = {
        user: {
          userId: manager._id.toString(),
          email: 'manager@test.com',
          role: 'manager'
        },
        body: {
          userId: otherEmployee._id.toString(),
          sleepHours: 8
        }
      };

      await simulateBurnoutRisk(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      const responseData = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Access denied');
    });

    it('should deny employee from simulating another employee\'s risk', async () => {
      const otherEmployee = await User.create({
        email: 'other@test.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'Employee',
        role: 'user',
        employeeId: '1002'
      });

      mockReq = {
        user: {
          userId: employee._id.toString(),
          email: 'employee@test.com',
          role: 'user'
        },
        body: {
          userId: otherEmployee._id.toString(),
          sleepHours: 8
        }
      };

      await simulateBurnoutRisk(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      const responseData = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Access denied');
    });
  });
});

