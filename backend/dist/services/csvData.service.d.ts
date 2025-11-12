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
    [key: string]: any;
}
export declare function normalizeId(id: string | undefined | null): string;
export declare function normalizeName(name: string | undefined | null): string;
export declare function initializeCSVDataCache(): void;
export declare function getEmployeeDataById(employeeId: string): EmployeeData | null;
export declare function getEmployeeDataByName(name: string): EmployeeData | null;
export declare function getEmployeeData(employeeId?: string, employeeName?: string): EmployeeData | null;
export declare function calculateDailySummary(employeeData: EmployeeData): {
    meetingsAttended: number;
    emailsResponded: number;
    workHoursLogged: number;
};
export declare function refreshCSVDataCache(): void;
export declare function getCacheStats(): {
    size: number;
    loadTime: Date | null;
};
//# sourceMappingURL=csvData.service.d.ts.map