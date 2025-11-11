import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare const ROLES: {
    readonly ADMIN: "admin";
    readonly MANAGER: "manager";
    readonly USER: "user";
};
export type UserRole = typeof ROLES[keyof typeof ROLES];
export declare function requirePermission(permission: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function requireRole(roles: UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireManagerOrAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function requireOwnResourceOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requireTeamAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function getUserPermissions(role: UserRole): string[];
export declare function canUserPerformAction(role: UserRole, action: string): boolean;
//# sourceMappingURL=rbac.middleware.d.ts.map