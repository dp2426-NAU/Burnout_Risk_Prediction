import { IUser } from '../models/user.model';
export interface AuthResult {
    success: boolean;
    user?: IUser;
    token?: string;
    message?: string;
}
interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}
export declare function registerUser(email: string, password: string, firstName: string, lastName: string, role?: 'admin' | 'user' | 'manager'): Promise<AuthResult>;
export declare function loginUser(email: string, password: string): Promise<AuthResult>;
export declare function verifyToken(token: string): JWTPayload | null;
export declare function getUserById(userId: string): Promise<IUser | null>;
export declare function updateUserProfile(userId: string, updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
}): Promise<AuthResult>;
export declare function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult>;
export declare function deactivateUser(userId: string): Promise<AuthResult>;
export {};
//# sourceMappingURL=auth.service.d.ts.map