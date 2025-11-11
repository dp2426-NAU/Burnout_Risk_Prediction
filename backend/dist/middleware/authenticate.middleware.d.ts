import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from './rbac.middleware';
export declare function authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=authenticate.middleware.d.ts.map