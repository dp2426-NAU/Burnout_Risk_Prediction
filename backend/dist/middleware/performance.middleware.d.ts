import { Request, Response, NextFunction } from 'express';
interface PerformanceMetrics {
    requestId: string;
    method: string;
    path: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    statusCode?: number;
    responseSize?: number;
    cacheHit?: boolean;
}
export declare const responseCompression: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const apiResponseCache: (ttlSeconds?: number) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const queryOptimization: (req: Request, res: Response, next: NextFunction) => void;
export declare const responseSizeOptimization: (req: Request, res: Response, next: NextFunction) => void;
export declare const performanceMonitoring: (req: Request, res: Response, next: NextFunction) => void;
export declare const databaseOptimization: (req: Request, res: Response, next: NextFunction) => void;
export declare const memoryMonitoring: (req: Request, res: Response, next: NextFunction) => void;
export declare function getPerformanceMetrics(): PerformanceMetrics[];
export declare function clearPerformanceMetrics(): void;
export declare function getPerformanceStats(): any;
export {};
//# sourceMappingURL=performance.middleware.d.ts.map