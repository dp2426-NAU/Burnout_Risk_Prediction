export interface ExtractedFeatures {
    workHours: number;
    overtimeHours: number;
    weekendWork: number;
    earlyMorningWork: number;
    lateNightWork: number;
    meetingCount: number;
    meetingDuration: number;
    backToBackMeetings: number;
    virtualMeetings: number;
    emailCount: number;
    avgEmailLength: number;
    stressEmailCount: number;
    urgentEmailCount: number;
    responseTime: number;
    totalEvents: number;
    avgEventDuration: number;
    focusTimeRatio: number;
    breakTimeRatio: number;
    stressLevel: number;
    workloadLevel: number;
    workLifeBalance: number;
    socialInteraction: number;
    teamCollaboration: number;
    sleepQuality: number;
    exerciseFrequency: number;
    nutritionQuality: number;
}
export declare function extractCalendarFeatures(userId: string, startDate: Date, endDate: Date): Promise<Partial<ExtractedFeatures>>;
export declare function extractEmailFeatures(userId: string, startDate: Date, endDate: Date): Promise<Partial<ExtractedFeatures>>;
export declare function extractAllFeatures(userId: string, startDate: Date, endDate: Date): Promise<ExtractedFeatures>;
export declare function normalizeFeatures(features: ExtractedFeatures): number[];
//# sourceMappingURL=featureExtractor.d.ts.map