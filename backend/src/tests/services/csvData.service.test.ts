// CSV data service tests - Tests CSV utility functions
import {
  normalizeId,
  normalizeName,
  calculateDailySummary,
  EmployeeData
} from '../../services/csvData.service';

describe('CSV Data Service', () => {
  describe('ID Normalization', () => {
    it('should normalize IDs correctly', () => {
      expect(normalizeId('  ABC123  ')).toBe('abc123');
      expect(normalizeId('ABC123')).toBe('abc123');
      expect(normalizeId('abc123')).toBe('abc123');
      expect(normalizeId('')).toBe('');
      expect(normalizeId(undefined)).toBe('');
      expect(normalizeId(null)).toBe('');
    });
  });

  describe('Name Normalization', () => {
    it('should normalize names correctly', () => {
      expect(normalizeName('  John Doe  ')).toBe('john doe');
      expect(normalizeName('John Doe')).toBe('john doe');
      expect(normalizeName('JOHN DOE')).toBe('john doe');
      expect(normalizeName('')).toBe('');
    });
  });


  describe('calculateDailySummary', () => {
    it('should calculate daily summary for regular employee', () => {
      const employeeData: EmployeeData = {
        employeeId: '1001',
        name: 'John Doe',
        workHoursPerWeek: 40,
        jobRole: 'Engineer'
      };

      const summary = calculateDailySummary(employeeData);
      
      expect(summary.workHoursLogged).toBe(8); // 40 / 5
      expect(summary.meetingsAttended).toBeGreaterThan(0);
      expect(summary.emailsResponded).toBeGreaterThan(0);
    });

    it('should calculate daily summary for manager (more meetings)', () => {
      const employeeData: EmployeeData = {
        employeeId: '1002',
        name: 'Jane Smith',
        workHoursPerWeek: 50,
        jobRole: 'Manager'
      };

      const summary = calculateDailySummary(employeeData);
      
      expect(summary.workHoursLogged).toBe(10); // 50 / 5
      expect(summary.meetingsAttended).toBeGreaterThan(0);
      expect(summary.emailsResponded).toBeGreaterThan(0);
    });

    it('should handle missing workHoursPerWeek', () => {
      const employeeData: EmployeeData = {
        employeeId: '1003',
        name: 'Test User'
      };

      const summary = calculateDailySummary(employeeData);
      
      expect(summary.workHoursLogged).toBe(8); // Default 40 / 5
      expect(summary.meetingsAttended).toBeGreaterThanOrEqual(0);
      expect(summary.emailsResponded).toBeGreaterThanOrEqual(0);
    });
  });
});

