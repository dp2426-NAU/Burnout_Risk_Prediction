import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/rbac.middleware';
export declare const getEmployeeDashboard: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const simulateEmployeeBurnout: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getManagerDashboard: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getEmployeeInsights: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getModelOperations: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=dashboard.controller.d.ts.map