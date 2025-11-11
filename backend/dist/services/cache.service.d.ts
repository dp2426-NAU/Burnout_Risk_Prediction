declare class CacheService {
    private redis;
    private isConnected;
    constructor();
    private setupEventListeners;
    isRedisConnected(): boolean;
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    setSession(sessionId: string, sessionData: any): Promise<boolean>;
    getSession(sessionId: string): Promise<any>;
    deleteSession(sessionId: string): Promise<boolean>;
    setUserProfile(userId: string, profileData: any): Promise<boolean>;
    getUserProfile(userId: string): Promise<any>;
    deleteUserProfile(userId: string): Promise<boolean>;
    setPrediction(predictionId: string, predictionData: any): Promise<boolean>;
    getPrediction(predictionId: string): Promise<any>;
    setUserPredictions(userId: string, predictions: any[]): Promise<boolean>;
    getUserPredictions(userId: string): Promise<any[]>;
    setDashboardData(userId: string, dashboardData: any): Promise<boolean>;
    getDashboardData(userId: string): Promise<any>;
    deleteDashboardData(userId: string): Promise<boolean>;
    setApiResponse(endpoint: string, params: any, response: any): Promise<boolean>;
    getApiResponse(endpoint: string, params: any): Promise<any>;
    private generateApiCacheKey;
    blacklistToken(token: string): Promise<boolean>;
    isTokenBlacklisted(token: string): Promise<boolean>;
    getCacheStats(): Promise<any>;
    healthCheck(): Promise<boolean>;
    clearAll(): Promise<boolean>;
    clearByPattern(pattern: string): Promise<number>;
    close(): Promise<void>;
}
export declare const cacheService: CacheService;
export default cacheService;
//# sourceMappingURL=cache.service.d.ts.map