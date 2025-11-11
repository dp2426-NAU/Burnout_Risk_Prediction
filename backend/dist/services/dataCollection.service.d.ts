export interface DataCollectionRequest {
    userId: string;
    startDate: Date;
    endDate: Date;
    dataTypes: ('calendar' | 'email' | 'profile')[];
    validateData?: boolean;
}
export interface DataCollectionResponse {
    success: boolean;
    collectionId?: string;
    message?: string;
    results?: {
        calendar?: {
            eventsCollected: number;
            versionId: string;
        };
        email?: {
            messagesCollected: number;
            versionId: string;
        };
        profile?: {
            profileUpdated: boolean;
            versionId: string;
        };
    };
    errors?: string[];
}
export interface PipelineStatus {
    status: 'operational' | 'not_initialized' | 'error';
    storageStatistics: {
        totalVersions: number;
        totalSizeMB: number;
        totalRecords: number;
        versionsByType: Record<string, number>;
    };
    recentActivity: {
        last24hVersions: number;
        last24hSizeMB: number;
        last24hRecords: number;
    };
    latestVersions: Array<{
        versionId: string;
        dataType: string;
        createdAt: string;
        recordCount: number;
        fileSizeMB: number;
    }>;
}
declare class DataCollectionService {
    private mlServiceUrl;
    private isInitialized;
    constructor();
    initialize(): Promise<void>;
    private testMLServiceConnection;
    collectUserData(request: DataCollectionRequest): Promise<DataCollectionResponse>;
    collectBatchData(userIds: string[], startDate: Date, endDate: Date, dataTypes?: ('calendar' | 'email' | 'profile')[], validateData?: boolean): Promise<{
        success: boolean;
        batchId?: string;
        userResults: Record<string, DataCollectionResponse>;
        summary: {
            successful: number;
            failed: number;
            totalDurationSeconds: number;
        };
        errors?: string[];
    }>;
    runScheduledCollection(daysBack?: number, userIds?: string[]): Promise<{
        success: boolean;
        scheduledRunId?: string;
        results?: any;
        errors?: string[];
    }>;
    getPipelineStatus(): Promise<PipelineStatus>;
    cleanupOldData(keepDays?: number): Promise<{
        success: boolean;
        message?: string;
        errors?: string[];
    }>;
    getDataLineage(versionId: string): Promise<{
        success: boolean;
        lineage?: any;
        errors?: string[];
    }>;
}
export declare const dataCollectionService: DataCollectionService;
export {};
//# sourceMappingURL=dataCollection.service.d.ts.map