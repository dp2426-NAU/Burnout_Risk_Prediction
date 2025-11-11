import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare const generateNewPrediction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getLatestUserPrediction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPredictionHistoryForUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPredictionById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPredictionStats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=prediction.controller.d.ts.map