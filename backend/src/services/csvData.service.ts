// CSV Data Service - Loads and caches employee data from CSV files
import * as fs from 'fs';
import * as path from 'path';
import { parse, CastingContext } from 'csv-parse/sync';
import { logger } from '../utils/logger';

// Employee data interface
export interface EmployeeData {
  employeeId?: string;
  name?: string;
  age?: number;
  gender?: string;
  jobRole?: string;
  department?: string;
  experience?: number;
  workHoursPerWeek?: number;
  remoteRatio?: number;
  remoteWork?: string;
  satisfactionLevel?: number;
  stressLevel?: number;
  burnout?: number;
  burnoutLevel?: number;
  burnoutRisk?: number;
  jobSatisfaction?: number;
  productivityScore?: number;
  sleepHours?: number;
  physicalActivityHrs?: number;
  commuteTime?: number;
  hasMentalHealthSupport?: string;
  managerSupportScore?: number;
  hasTherapyAccess?: string;
  mentalHealthDaysOff?: number;
  salaryRange?: string;
  workLifeBalanceScore?: number;
  teamSize?: number;
  careerGrowthScore?: number;
  country?: string;
  yearsAtCompany?: number;
  // Merged from all CSVs
  [key: string]: any;
}

// Cache for CSV data
let csvDataCache: Map<string, EmployeeData> | null = null;
let csvLoadTime: Date | null = null;

/**
 * Normalize ID for consistent matching
 */
export function normalizeId(id: string | undefined | null): string {
  if (!id) return '';
  return id.toString().trim().toLowerCase();
}

/**
 * Normalize name for consistent matching
 */
export function normalizeName(name: string | undefined | null): string {
  if (!name) return '';
  return name.toString().trim().toLowerCase();
}

/**
 * Load CSV file and parse it
 */
function loadCSVFile(filePath: string): any[] {
  try {
    if (!fs.existsSync(filePath)) {
      logger.warn(`CSV file not found: ${filePath}`);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value: string, context: CastingContext) => {
        // Try to cast numbers
        const columnName = typeof context.column === 'string' ? context.column : undefined;
        if (columnName && ['Age', 'Experience', 'WorkHoursPerWeek', 'RemoteRatio', 
            'SatisfactionLevel', 'StressLevel', 'Burnout', 'BurnoutLevel', 'BurnoutRisk',
            'JobSatisfaction', 'ProductivityScore', 'SleepHours', 'PhysicalActivityHrs',
            'CommuteTime', 'ManagerSupportScore', 'MentalHealthDaysOff', 'WorkLifeBalanceScore',
            'TeamSize', 'CareerGrowthScore', 'YearsAtCompany'].includes(columnName)) {
          const num = parseFloat(value);
          return isNaN(num) ? value : num;
        }
        return value;
      }
    });

    logger.info(`Loaded ${records.length} records from ${path.basename(filePath)}`);
    return records;
  } catch (error) {
    logger.error(`Error loading CSV file ${filePath}:`, error);
    return [];
  }
}

/**
 * Load all CSV files and merge employee data
 */
function loadAllCSVData(): Map<string, EmployeeData> {
  const employeeMap = new Map<string, EmployeeData>();
  
  // Get the base directory - try multiple possible locations
  // In production: __dirname will be dist/services, so go up 3 levels
  // In development: might be different, so try process.cwd() first
  let baseDir: string;
  try {
    // Try process.cwd() first (works when running from project root)
    baseDir = process.cwd();
    // Verify datasets directory exists
    const testPath = path.join(baseDir, 'datasets', 'raw');
    if (!fs.existsSync(testPath)) {
      // Fallback to __dirname relative path
      baseDir = path.resolve(__dirname, '../../..');
    }
  } catch {
    // Final fallback
    baseDir = path.resolve(__dirname, '../../..');
  }
  
  const datasetsDir = path.join(baseDir, 'datasets', 'raw');

  // Load all three CSV files
  const csvFiles = [
    'synthetic_employee_burnout.csv',
    'mental_health_workplace_survey.csv',
    'synthetic_generated_burnout.csv'
  ];

  for (const csvFile of csvFiles) {
    const filePath = path.join(datasetsDir, csvFile);
    const records = loadCSVFile(filePath);

    for (const record of records) {
      // Try to get employee ID (different column names in different CSVs)
      const employeeId = record.EmployeeID || record.employeeId || record.id;
      const name = record.Name || record.name;

      // Use ID as primary key, fallback to name
      const key = employeeId ? normalizeId(employeeId) : normalizeName(name);
      
      if (!key) continue; // Skip records without ID or name

      // Get existing employee data or create new
      let employee = employeeMap.get(key) || {} as EmployeeData;

      // Merge data from this CSV
      employee = {
        ...employee,
        employeeId: employeeId || employee.employeeId,
        name: name || employee.name,
        age: record.Age || record.age || employee.age,
        gender: record.Gender || record.gender || employee.gender,
        jobRole: record.JobRole || record.jobRole || employee.jobRole,
        department: record.Department || record.department || employee.department,
        experience: record.Experience || record.YearsAtCompany || record.experience || employee.experience,
        workHoursPerWeek: record.WorkHoursPerWeek || record.workHoursPerWeek || employee.workHoursPerWeek,
        remoteRatio: record.RemoteRatio || record.remoteRatio || employee.remoteRatio,
        remoteWork: record.RemoteWork || record.remoteWork || employee.remoteWork,
        satisfactionLevel: record.SatisfactionLevel || record.satisfactionLevel || employee.satisfactionLevel,
        stressLevel: record.StressLevel || record.stressLevel || employee.stressLevel,
        burnout: record.Burnout !== undefined ? record.Burnout : (record.burnout !== undefined ? record.burnout : employee.burnout),
        burnoutLevel: record.BurnoutLevel || record.burnoutLevel || employee.burnoutLevel,
        burnoutRisk: record.BurnoutRisk !== undefined ? record.BurnoutRisk : (record.burnoutRisk !== undefined ? record.burnoutRisk : employee.burnoutRisk),
        jobSatisfaction: record.JobSatisfaction || record.jobSatisfaction || employee.jobSatisfaction,
        productivityScore: record.ProductivityScore || record.productivityScore || employee.productivityScore,
        sleepHours: record.SleepHours || record.sleepHours || employee.sleepHours,
        physicalActivityHrs: record.PhysicalActivityHrs || record.physicalActivityHrs || employee.physicalActivityHrs,
        commuteTime: record.CommuteTime || record.commuteTime || employee.commuteTime,
        hasMentalHealthSupport: record.HasMentalHealthSupport || record.hasMentalHealthSupport || employee.hasMentalHealthSupport,
        managerSupportScore: record.ManagerSupportScore || record.managerSupportScore || employee.managerSupportScore,
        hasTherapyAccess: record.HasTherapyAccess || record.hasTherapyAccess || employee.hasTherapyAccess,
        mentalHealthDaysOff: record.MentalHealthDaysOff || record.mentalHealthDaysOff || employee.mentalHealthDaysOff,
        salaryRange: record.SalaryRange || record.salaryRange || employee.salaryRange,
        workLifeBalanceScore: record.WorkLifeBalanceScore || record.workLifeBalanceScore || employee.workLifeBalanceScore,
        teamSize: record.TeamSize || record.teamSize || employee.teamSize,
        careerGrowthScore: record.CareerGrowthScore || record.careerGrowthScore || employee.careerGrowthScore,
        country: record.Country || record.country || employee.country,
        yearsAtCompany: record.YearsAtCompany || record.yearsAtCompany || employee.yearsAtCompany,
        // Store all other fields
        ...Object.keys(record).reduce((acc, key) => {
          if (!['EmployeeID', 'employeeId', 'id', 'Name', 'name'].includes(key)) {
            acc[key] = record[key];
          }
          return acc;
        }, {} as any)
      };

      employeeMap.set(key, employee);
    }
  }

  logger.info(`Merged CSV data: ${employeeMap.size} unique employees`);
  return employeeMap;
}

/**
 * Initialize CSV data cache (load once on server startup)
 */
export function initializeCSVDataCache(): void {
  try {
    logger.info('Initializing CSV data cache...');
    csvDataCache = loadAllCSVData();
    csvLoadTime = new Date();
    logger.info(`CSV data cache initialized with ${csvDataCache.size} employees`);
  } catch (error) {
    logger.error('Error initializing CSV data cache:', error);
    csvDataCache = new Map();
  }
}

/**
 * Get CSV data cache (load if not initialized)
 */
function getCSVDataCache(): Map<string, EmployeeData> {
  if (!csvDataCache) {
    initializeCSVDataCache();
  }
  return csvDataCache || new Map();
}

/**
 * Get employee data by ID (primary method)
 */
export function getEmployeeDataById(employeeId: string): EmployeeData | null {
  const normalizedId = normalizeId(employeeId);
  const cache = getCSVDataCache();
  return cache.get(normalizedId) || null;
}

/**
 * Get employee data by name (fallback method)
 */
export function getEmployeeDataByName(name: string): EmployeeData | null {
  const normalizedName = normalizeName(name);
  const cache = getCSVDataCache();
  
  // Search through cache for matching name
  for (const [key, employee] of Array.from(cache.entries())) {
    if (normalizeName(employee.name) === normalizedName) {
      return employee;
    }
  }
  
  return null;
}

/**
 * Get employee data by ID or name (tries ID first, then name)
 */
export function getEmployeeData(employeeId?: string, employeeName?: string): EmployeeData | null {
  // Try ID first (primary method)
  if (employeeId) {
    const data = getEmployeeDataById(employeeId);
    if (data) return data;
  }
  
  // Fallback to name
  if (employeeName) {
    return getEmployeeDataByName(employeeName);
  }
  
  return null;
}

/**
 * Calculate daily summary metrics from employee data
 */
export function calculateDailySummary(employeeData: EmployeeData): {
  meetingsAttended: number;
  emailsResponded: number;
  workHoursLogged: number;
} {
  const workHoursPerWeek = employeeData.workHoursPerWeek || 40;
  const workHoursPerDay = workHoursPerWeek / 5;
  
  // Estimate meetings based on work hours and role
  // Managers typically have more meetings
  const isManager = employeeData.jobRole?.toLowerCase().includes('manager') || 
                     employeeData.jobRole?.toLowerCase().includes('lead');
  const meetingRatio = isManager ? 0.3 : 0.15; // 30% for managers, 15% for others
  const meetingsAttended = Math.round(workHoursPerDay * meetingRatio);
  
  // Estimate emails based on work hours and role
  const emailRatio = isManager ? 25 : 15; // emails per hour
  const emailsResponded = Math.round(workHoursPerDay * emailRatio);
  
  return {
    meetingsAttended,
    emailsResponded,
    workHoursLogged: Math.round(workHoursPerDay * 10) / 10 // Round to 1 decimal
  };
}

/**
 * Refresh CSV data cache (useful for development/testing)
 */
export function refreshCSVDataCache(): void {
  logger.info('Refreshing CSV data cache...');
  initializeCSVDataCache();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; loadTime: Date | null } {
  return {
    size: csvDataCache?.size || 0,
    loadTime: csvLoadTime
  };
}

