export interface RefreshTokenResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    message?: string;
}
export interface TokenValidation {
    valid: boolean;
    payload?: any;
    error?: string;
}
declare class RefreshTokenService {
    private readonly refreshTokenExpiry;
    private readonly accessTokenExpiry;
    generateRefreshToken(userId: string, email: string): string;
    generateAccessToken(userId: string, email: string, role: string): string;
    validateRefreshToken(token: string): TokenValidation;
    refreshAccessToken(refreshToken: string, userRole: string): Promise<RefreshTokenResponse>;
    revokeRefreshToken(token: string): Promise<boolean>;
    isTokenBlacklisted(token: string): Promise<boolean>;
    getTokenExpiry(token: string): Date | null;
}
export declare const refreshTokenService: RefreshTokenService;
export default refreshTokenService;
//# sourceMappingURL=refreshToken.service.d.ts.map