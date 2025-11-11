import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/rbac.middleware';
export declare const generateNewPrediction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getLatestUserPrediction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPredictionHistoryForUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPredictionById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPredictionStats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=prediction.controller.d.ts.map