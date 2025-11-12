import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/rbac.middleware';
export declare const getEmployeeDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getEmployeeDashboardById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getProfileOverview: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const simulateBurnoutRisk: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=dashboard.controller.d.ts.map