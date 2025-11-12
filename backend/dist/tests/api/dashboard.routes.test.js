"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const dashboard_routes_1 = __importDefault(require("../../api/routes/dashboard.routes"));
const user_model_1 = require("../../models/user.model");
const testHelpers_1 = require("../helpers/testHelpers");
const csvDataService = __importStar(require("../../services/csvData.service"));
jest.mock('../../services/csvData.service');
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/dashboard', dashboard_routes_1.default);
describe('Dashboard Access Control', () => {
    let employeeToken;
    let employeeId;
    let managerToken;
    let managerId;
    let adminToken;
    let adminId;
    let otherEmployeeToken;
    let otherEmployeeId;
    beforeEach(async () => {
        await user_model_1.User.deleteMany({});
        const employee = await user_model_1.User.create({
            email: 'employee@test.com',
            password: 'password123',
            firstName: 'Employee',
            lastName: 'User',
            role: 'user',
            employeeId: '1001',
            employeeName: 'Employee User'
        });
        employeeId = employee._id.toString();
        employeeToken = (0, testHelpers_1.generateTestToken)(employee);
        const otherEmployee = await user_model_1.User.create({
            email: 'otheremployee@test.com',
            password: 'password123',
            firstName: 'Other',
            lastName: 'Employee',
            role: 'user',
            employeeId: '1002',
            employeeName: 'Other Employee'
        });
        otherEmployeeId = otherEmployee._id.toString();
        otherEmployeeToken = (0, testHelpers_1.generateTestToken)(otherEmployee);
        const manager = await user_model_1.User.create({
            email: 'manager@test.com',
            password: 'password123',
            firstName: 'Manager',
            lastName: 'User',
            role: 'manager',
            employeeId: '2001',
            employeeName: 'Manager User'
        });
        managerId = manager._id.toString();
        managerToken = (0, testHelpers_1.generateTestToken)(manager);
        employee.managerId = manager._id;
        await employee.save();
        const admin = await user_model_1.User.create({
            email: 'admin@test.com',
            password: 'password123',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            employeeId: '3001',
            employeeName: 'Admin User'
        });
        adminId = admin._id.toString();
        adminToken = (0, testHelpers_1.generateTestToken)(admin);
        csvDataService.getEmployeeData.mockImplementation((empId, empName) => {
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
        csvDataService.calculateDailySummary.mockImplementation((data) => ({
            meetingsAttended: Math.round((data.workHoursPerWeek || 40) / 5 * 0.15),
            emailsResponded: Math.round((data.workHoursPerWeek || 40) / 5 * 15),
            workHoursLogged: (data.workHoursPerWeek || 40) / 5
        }));
    });
    describe('GET /api/dashboard/employee', () => {
        it('should allow employee to access their own dashboard', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/dashboard/employee')
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.userId).toBe(employeeId);
        });
        it('should deny employee access to another employee\'s data via query param', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/employee?userId=${otherEmployeeId}`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Access denied');
        });
        it('should allow manager to access their direct report\'s data via query param', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/employee?userId=${employeeId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.userId).toBe(employeeId);
        });
        it('should deny manager access to employee not under them', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/employee?userId=${otherEmployeeId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Access denied');
        });
        it('should allow admin to access any employee\'s data via query param', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/employee?userId=${employeeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.userId).toBe(employeeId);
        });
        it('should return 401 without authentication token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/dashboard/employee')
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Access token required');
        });
    });
    describe('GET /api/dashboard/employee/:userId', () => {
        it('should allow manager to access their direct report\'s data by ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/employee/${employeeId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.userId).toBe(employeeId);
        });
        it('should deny manager access to employee not under them', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/employee/${otherEmployeeId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Access denied');
        });
        it('should allow admin to access employee data by ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/employee/${employeeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.userId).toBe(employeeId);
        });
        it('should deny employee access to this endpoint', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/employee/${otherEmployeeId}`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('manager or admin role required');
        });
    });
    describe('GET /api/dashboard/profile', () => {
        it('should allow employee to access their own profile', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/dashboard/profile')
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.profile.name).toBe('Employee User');
        });
        it('should deny employee access to another employee\'s profile', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/profile?userId=${otherEmployeeId}`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
        });
        it('should allow manager to access their direct report\'s profile', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/profile?userId=${employeeId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.profile.name).toBe('Employee User');
        });
        it('should deny manager access to employee not under them', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/dashboard/profile?userId=${otherEmployeeId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Access denied');
        });
    });
    describe('POST /api/dashboard/simulate', () => {
        it('should allow employee to simulate their own burnout risk', async () => {
            const response = await (0, supertest_1.default)(app)
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
            const response = await (0, supertest_1.default)(app)
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
            const response = await (0, supertest_1.default)(app)
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
            const response = await (0, supertest_1.default)(app)
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
//# sourceMappingURL=dashboard.routes.test.js.map