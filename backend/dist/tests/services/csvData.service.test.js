"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const csvData_service_1 = require("../../services/csvData.service");
describe('CSV Data Service', () => {
    describe('ID Normalization', () => {
        it('should normalize IDs correctly', () => {
            expect((0, csvData_service_1.normalizeId)('  ABC123  ')).toBe('abc123');
            expect((0, csvData_service_1.normalizeId)('ABC123')).toBe('abc123');
            expect((0, csvData_service_1.normalizeId)('abc123')).toBe('abc123');
            expect((0, csvData_service_1.normalizeId)('')).toBe('');
            expect((0, csvData_service_1.normalizeId)(undefined)).toBe('');
            expect((0, csvData_service_1.normalizeId)(null)).toBe('');
        });
    });
    describe('Name Normalization', () => {
        it('should normalize names correctly', () => {
            expect((0, csvData_service_1.normalizeName)('  John Doe  ')).toBe('john doe');
            expect((0, csvData_service_1.normalizeName)('John Doe')).toBe('john doe');
            expect((0, csvData_service_1.normalizeName)('JOHN DOE')).toBe('john doe');
            expect((0, csvData_service_1.normalizeName)('')).toBe('');
        });
    });
    describe('calculateDailySummary', () => {
        it('should calculate daily summary for regular employee', () => {
            const employeeData = {
                employeeId: '1001',
                name: 'John Doe',
                workHoursPerWeek: 40,
                jobRole: 'Engineer'
            };
            const summary = (0, csvData_service_1.calculateDailySummary)(employeeData);
            expect(summary.workHoursLogged).toBe(8);
            expect(summary.meetingsAttended).toBeGreaterThan(0);
            expect(summary.emailsResponded).toBeGreaterThan(0);
        });
        it('should calculate daily summary for manager (more meetings)', () => {
            const employeeData = {
                employeeId: '1002',
                name: 'Jane Smith',
                workHoursPerWeek: 50,
                jobRole: 'Manager'
            };
            const summary = (0, csvData_service_1.calculateDailySummary)(employeeData);
            expect(summary.workHoursLogged).toBe(10);
            expect(summary.meetingsAttended).toBeGreaterThan(0);
            expect(summary.emailsResponded).toBeGreaterThan(0);
        });
        it('should handle missing workHoursPerWeek', () => {
            const employeeData = {
                employeeId: '1003',
                name: 'Test User'
            };
            const summary = (0, csvData_service_1.calculateDailySummary)(employeeData);
            expect(summary.workHoursLogged).toBe(8);
            expect(summary.meetingsAttended).toBeGreaterThanOrEqual(0);
            expect(summary.emailsResponded).toBeGreaterThanOrEqual(0);
        });
    });
});
//# sourceMappingURL=csvData.service.test.js.map