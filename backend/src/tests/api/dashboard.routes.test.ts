// Dashboard controller access control tests
import request from 'supertest';
import express from 'express';
import dashboardRoutes from '../../api/routes/dashboard.routes';
import { User } from '../../models/user.model';
import { generateTestToken } from '../helpers/testHelpers';
import * as csvDataService from '../../services/csvData.service';

// Mock CSV data service
jest.mock('../../services/csvData.service');

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

describe('Dashboard Access Control', () => {
  let employeeToken: string;
  let employeeId: string;
  let managerToken: string;
  let managerId: string;
  let adminToken: string;
  let adminId: string;
  let otherEmployeeToken: string;
  let otherEmployeeId: string;

  beforeEach(async () => {
    await User.deleteMany({});

    // Create test users
    const employee = await User.create({
      email: 'employee@test.com',
      password: 'password123',
      firstName: 'Employee',
      lastName: 'User',
      role: 'user',
      employeeId: '1001',
      employeeName: 'Employee User'
    });
    employeeId = employee._id.toString();
    employeeToken = generateTestToken(employee);

    const otherEmployee = await User.create({
      email: 'otheremployee@test.com',
      password: 'password123',
      firstName: 'Other',
      lastName: 'Employee',
      role: 'user',
      employeeId: '1002',
      employeeName: 'Other Employee'
    });
    otherEmployeeId = otherEmployee._id.toString();
    otherEmployeeToken = generateTestToken(otherEmployee);

    const manager = await User.create({
      email: 'manager@test.com',
      password: 'password123',
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager',
      employeeId: '2001',
      employeeName: 'Manager User'
    });
    managerId = manager._id.toString();
    managerToken = generateTestToken(manager);

    // Assign employee to manager (set managerId)
    employee.managerId = manager._id;
    await employee.save();

    const admin = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      employeeId: '3001',
      employeeName: 'Admin User'
    });
    adminId = admin._id.toString();
    adminToken = generateTestToken(admin);

    // Mock CSV data service
    (csvDataService.getEmployeeData as jest.Mock).mockImplementation((empId: string, empName: string) => {
      if (empId === '1001' || empName === 'Employee User') {
        return {
          employeeId: '1001',
          name: 'Employee User',
          jobRole: 'Engineer',
          workHoursPerWeek: 40,
          stressLevel: 5,
          sleepHours: 7,
          workLifeBalanceScore: 6,
          jobSatisfaction: 6,
          physicalActivityHrs: 3
        };
      }
      if (empId === '1002' || empName === 'Other Employee') {
        return {
          employeeId: '1002',
          name: 'Other Employee',
          jobRole: 'Analyst',
          workHoursPerWeek: 45,
          stressLevel: 6,
          sleepHours: 6.5,
          workLifeBalanceScore: 5,
          jobSatisfaction: 5,
          physicalActivityHrs: 2
        };
      }
      return null;
    });

    (csvDataService.calculateDailySummary as jest.Mock).mockImplementation((data: any) => ({
      meetingsAttended: Math.round((data.workHoursPerWeek || 40) / 5 * 0.15),
      emailsResponded: Math.round((data.workHoursPerWeek || 40) / 5 * 15),
      workHoursLogged: (data.workHoursPerWeek || 40) / 5
    }));
  });

  describe('GET /api/dashboard/employee', () => {
    it('should allow employee to access their own dashboard', async () => {
      const response = await request(app)
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(employeeId);
    });

    it('should deny employee access to another employee\'s data via query param', async () => {
      const response = await request(app)
        .get(`/api/dashboard/employee?userId=${otherEmployeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should allow manager to access their direct report\'s data via query param', async () => {
      const response = await request(app)
        .get(`/api/dashboard/employee?userId=${employeeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(employeeId);
    });

    it('should deny manager access to employee not under them', async () => {
      const response = await request(app)
        .get(`/api/dashboard/employee?userId=${otherEmployeeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should allow admin to access any employee\'s data via query param', async () => {
      const response = await request(app)
        .get(`/api/dashboard/employee?userId=${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(employeeId);
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/dashboard/employee')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/dashboard/employee/:userId', () => {
    it('should allow manager to access their direct report\'s data by ID', async () => {
      const response = await request(app)
        .get(`/api/dashboard/employee/${employeeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(employeeId);
    });

    it('should deny manager access to employee not under them', async () => {
      const response = await request(app)
        .get(`/api/dashboard/employee/${otherEmployeeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should allow admin to access employee data by ID', async () => {
      const response = await request(app)
        .get(`/api/dashboard/employee/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(employeeId);
    });

    it('should deny employee access to this endpoint', async () => {
      const response = await request(app)
        .get(`/api/dashboard/employee/${otherEmployeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('manager or admin role required');
    });
  });

  describe('GET /api/dashboard/profile', () => {
    it('should allow employee to access their own profile', async () => {
      const response = await request(app)
        .get('/api/dashboard/profile')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.name).toBe('Employee User');
    });

    it('should deny employee access to another employee\'s profile', async () => {
      const response = await request(app)
        .get(`/api/dashboard/profile?userId=${otherEmployeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow manager to access their direct report\'s profile', async () => {
      const response = await request(app)
        .get(`/api/dashboard/profile?userId=${employeeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.name).toBe('Employee User');
    });

    it('should deny manager access to employee not under them', async () => {
      const response = await request(app)
        .get(`/api/dashboard/profile?userId=${otherEmployeeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('POST /api/dashboard/simulate', () => {
    it('should allow employee to simulate their own burnout risk', async () => {
      const response = await request(app)
        .post('/api/dashboard/simulate')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          meetingHours: 3,
          workHours: 8,
          sleepHours: 8
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.baseRiskScore).toBeDefined();
      expect(response.body.data.simulatedRiskScore).toBeDefined();
    });

    it('should deny employee from simulating another employee\'s risk', async () => {
      const response = await request(app)
        .post('/api/dashboard/simulate')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          userId: otherEmployeeId,
          meetingHours: 3,
          workHours: 8,
          sleepHours: 8
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow manager to simulate their direct report\'s burnout risk', async () => {
      const response = await request(app)
        .post('/api/dashboard/simulate')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          userId: employeeId,
          meetingHours: 3,
          workHours: 8,
          sleepHours: 8
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny manager from simulating employee not under them', async () => {
      const response = await request(app)
        .post('/api/dashboard/simulate')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          userId: otherEmployeeId,
          meetingHours: 3,
          workHours: 8,
          sleepHours: 8
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });
});

