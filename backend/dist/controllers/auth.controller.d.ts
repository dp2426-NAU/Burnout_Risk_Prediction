import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const getProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const changeUserPassword: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deactivateAccount: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=auth.controller.d.ts.map