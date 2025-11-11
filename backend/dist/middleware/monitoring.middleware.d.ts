import { Request, Response, NextFunction } from 'express';
export declare const enhancedHealthCheck: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const metricsCollection: (req: Request, res: Response, next: NextFunction) => void;
export declare const structuredLogging: (req: Request, res: Response, next: NextFunction) => void;
export declare const alerting: (req: Request, res: Response, next: NextFunction) => void;
export declare function getMetricsSummary(): any;
export declare function clearMetrics(): void;
export declare function getDetailedMetrics(): any;
//# sourceMappingURL=monitoring.middleware.d.ts.map