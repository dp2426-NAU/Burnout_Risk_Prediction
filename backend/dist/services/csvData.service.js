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
exports.normalizeId = normalizeId;
exports.normalizeName = normalizeName;
exports.initializeCSVDataCache = initializeCSVDataCache;
exports.getEmployeeDataById = getEmployeeDataById;
exports.getEmployeeDataByName = getEmployeeDataByName;
exports.getEmployeeData = getEmployeeData;
exports.calculateDailySummary = calculateDailySummary;
exports.refreshCSVDataCache = refreshCSVDataCache;
exports.getCacheStats = getCacheStats;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sync_1 = require("csv-parse/sync");
const logger_1 = require("../utils/logger");
let csvDataCache = null;
let csvLoadTime = null;
function normalizeId(id) {
    if (!id)
        return '';
    return id.toString().trim().toLowerCase();
}
function normalizeName(name) {
    if (!name)
        return '';
    return name.toString().trim().toLowerCase();
}
function loadCSVFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            logger_1.logger.warn(`CSV file not found: ${filePath}`);
            return [];
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = (0, sync_1.parse)(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: (value, context) => {
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
        logger_1.logger.info(`Loaded ${records.length} records from ${path.basename(filePath)}`);
        return records;
    }
    catch (error) {
        logger_1.logger.error(`Error loading CSV file ${filePath}:`, error);
        return [];
    }
}
function loadAllCSVData() {
    const employeeMap = new Map();
    let baseDir;
    try {
        baseDir = process.cwd();
        const testPath = path.join(baseDir, 'datasets', 'raw');
        if (!fs.existsSync(testPath)) {
            baseDir = path.resolve(__dirname, '../../..');
        }
    }
    catch {
        baseDir = path.resolve(__dirname, '../../..');
    }
    const datasetsDir = path.join(baseDir, 'datasets', 'raw');
    const csvFiles = [
        'synthetic_employee_burnout.csv',
        'mental_health_workplace_survey.csv',
        'synthetic_generated_burnout.csv'
    ];
    for (const csvFile of csvFiles) {
        const filePath = path.join(datasetsDir, csvFile);
        const records = loadCSVFile(filePath);
        for (const record of records) {
            const employeeId = record.EmployeeID || record.employeeId || record.id;
            const name = record.Name || record.name;
            const key = employeeId ? normalizeId(employeeId) : normalizeName(name);
            if (!key)
                continue;
            let employee = employeeMap.get(key) || {};
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
                ...Object.keys(record).reduce((acc, key) => {
                    if (!['EmployeeID', 'employeeId', 'id', 'Name', 'name'].includes(key)) {
                        acc[key] = record[key];
                    }
                    return acc;
                }, {})
            };
            employeeMap.set(key, employee);
        }
    }
    logger_1.logger.info(`Merged CSV data: ${employeeMap.size} unique employees`);
    return employeeMap;
}
function initializeCSVDataCache() {
    try {
        logger_1.logger.info('Initializing CSV data cache...');
        csvDataCache = loadAllCSVData();
        csvLoadTime = new Date();
        logger_1.logger.info(`CSV data cache initialized with ${csvDataCache.size} employees`);
    }
    catch (error) {
        logger_1.logger.error('Error initializing CSV data cache:', error);
        csvDataCache = new Map();
    }
}
function getCSVDataCache() {
    if (!csvDataCache) {
        initializeCSVDataCache();
    }
    return csvDataCache || new Map();
}
function getEmployeeDataById(employeeId) {
    const normalizedId = normalizeId(employeeId);
    const cache = getCSVDataCache();
    return cache.get(normalizedId) || null;
}
function getEmployeeDataByName(name) {
    const normalizedName = normalizeName(name);
    const cache = getCSVDataCache();
    for (const [key, employee] of Array.from(cache.entries())) {
        if (normalizeName(employee.name) === normalizedName) {
            return employee;
        }
    }
    return null;
}
function getEmployeeData(employeeId, employeeName) {
    if (employeeId) {
        const data = getEmployeeDataById(employeeId);
        if (data)
            return data;
    }
    if (employeeName) {
        return getEmployeeDataByName(employeeName);
    }
    return null;
}
function calculateDailySummary(employeeData) {
    const workHoursPerWeek = employeeData.workHoursPerWeek || 40;
    const workHoursPerDay = workHoursPerWeek / 5;
    const isManager = employeeData.jobRole?.toLowerCase().includes('manager') ||
        employeeData.jobRole?.toLowerCase().includes('lead');
    const meetingRatio = isManager ? 0.3 : 0.15;
    const meetingsAttended = Math.round(workHoursPerDay * meetingRatio);
    const emailRatio = isManager ? 25 : 15;
    const emailsResponded = Math.round(workHoursPerDay * emailRatio);
    return {
        meetingsAttended,
        emailsResponded,
        workHoursLogged: Math.round(workHoursPerDay * 10) / 10
    };
}
function refreshCSVDataCache() {
    logger_1.logger.info('Refreshing CSV data cache...');
    initializeCSVDataCache();
}
function getCacheStats() {
    return {
        size: csvDataCache?.size || 0,
        loadTime: csvLoadTime
    };
}
//# sourceMappingURL=csvData.service.js.map