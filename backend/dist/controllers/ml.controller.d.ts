import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/rbac.middleware';
export declare const retrainModels: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const fetchEdaReport: (_req: Request, res: Response) => Promise<void>;
export declare const fetchTrainingMetrics: (_req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=ml.controller.d.ts.map