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
Object.defineProperty(exports, "__esModule", { value: true });
const dashboard_controller_1 = require("../../controllers/dashboard.controller");
const user_model_1 = require("../../models/user.model");
const csvDataService = __importStar(require("../../services/csvData.service"));
jest.mock('../../services/csvData.service');
describe('Dashboard Controller - Simulation', () => {
    let mockReq;
    let mockRes;
    let employee;
    let manager;
    beforeEach(async () => {
        await user_model_1.User.deleteMany({});
        employee = await user_model_1.User.create({
            email: 'employee@test.com',
            password: 'password123',
            firstName: 'Employee',
            lastName: 'User',
            role: 'user',
            employeeId: '1001',
            employeeName: 'Employee User'
        });
        manager = await user_model_1.User.create({
            email: 'manager@test.com',
            password: 'password123',
            firstName: 'Manager',
            lastName: 'User',
            role: 'manager',
            employeeId: '2001',
            employeeName: 'Manager User'
        });
        employee.managerId = manager._id;
        await employee.save();
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        csvDataService.getEmployeeData.mockReturnValue({
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
            await (0, dashboard_controller_1.simulateBurnoutRisk)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalled();
            const responseData = mockRes.json.mock.calls[0][0];
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
                    sleepHours: 9
                }
            };
            await (0, dashboard_controller_1.simulateBurnoutRisk)(mockReq, mockRes);
            const responseData = mockRes.json.mock.calls[0][0];
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
                    workHours: 10
                }
            };
            await (0, dashboard_controller_1.simulateBurnoutRisk)(mockReq, mockRes);
            const responseData = mockRes.json.mock.calls[0][0];
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
            await (0, dashboard_controller_1.simulateBurnoutRisk)(mockReq, mockRes);
            const responseData = mockRes.json.mock.calls[0][0];
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
            await (0, dashboard_controller_1.simulateBurnoutRisk)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            const responseData = mockRes.json.mock.calls[0][0];
            expect(responseData.success).toBe(true);
        });
        it('should deny manager from simulating employee not under them', async () => {
            const otherEmployee = await user_model_1.User.create({
                email: 'other@test.com',
                password: 'password123',
                firstName: 'Other',
                lastName: 'Employee',
                role: 'user',
                employeeId: '1002',
                managerId: null
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
            await (0, dashboard_controller_1.simulateBurnoutRisk)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            const responseData = mockRes.json.mock.calls[0][0];
            expect(responseData.success).toBe(false);
            expect(responseData.message).toContain('Access denied');
        });
        it('should deny employee from simulating another employee\'s risk', async () => {
            const otherEmployee = await user_model_1.User.create({
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
            await (0, dashboard_controller_1.simulateBurnoutRisk)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            const responseData = mockRes.json.mock.calls[0][0];
            expect(responseData.success).toBe(false);
            expect(responseData.message).toContain('Access denied');
        });
    });
});
//# sourceMappingURL=dashboard.controller.test.js.map