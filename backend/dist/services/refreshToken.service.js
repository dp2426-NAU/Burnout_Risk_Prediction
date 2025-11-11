"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class RefreshTokenService {
    constructor() {
        this.refreshTokenExpiry = '7d';
        this.accessTokenExpiry = env_1.JWT_EXPIRES_IN;
    }
    generateRefreshToken(userId, email) {
        try {
            const payload = {
                userId,
                email,
                type: 'refresh'
            };
            const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.JWT_SECRET, {
                expiresIn: this.refreshTokenExpiry
            });
            logger_1.logger.info(`Refresh token generated for user: ${email}`);
            return refreshToken;
        }
        catch (error) {
            logger_1.logger.error('Error generating refresh token:', error);
            throw new Error('Failed to generate refresh token');
        }
    }
    generateAccessToken(userId, email, role) {
        try {
            const payload = {
                userId,
                email,
                role,
                type: 'access'
            };
            const accessToken = jsonwebtoken_1.default.sign(payload, env_1.JWT_SECRET, {
                expiresIn: this.accessTokenExpiry
            });
            logger_1.logger.info(`Access token generated for user: ${email}`);
            return accessToken;
        }
        catch (error) {
            logger_1.logger.error('Error generating access token:', error);
            throw new Error('Failed to generate access token');
        }
    }
    validateRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
            if (decoded.type !== 'refresh') {
                return {
                    valid: false,
                    error: 'Invalid token type'
                };
            }
            return {
                valid: true,
                payload: decoded
            };
        }
        catch (error) {
            logger_1.logger.warn('Invalid refresh token:', error);
            return {
                valid: false,
                error: 'Invalid or expired refresh token'
            };
        }
    }
    async refreshAccessToken(refreshToken, userRole) {
        try {
            const validation = this.validateRefreshToken(refreshToken);
            if (!validation.valid || !validation.payload) {
                return {
                    success: false,
                    message: validation.error || 'Invalid refresh token'
                };
            }
            const { userId, email } = validation.payload;
            const newAccessToken = this.generateAccessToken(userId, email, userRole);
            const newRefreshToken = this.generateRefreshToken(userId, email);
            logger_1.logger.info(`Tokens refreshed for user: ${email}`);
            return {
                success: true,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };
        }
        catch (error) {
            logger_1.logger.error('Error refreshing access token:', error);
            return {
                success: false,
                message: 'Failed to refresh access token'
            };
        }
    }
    async revokeRefreshToken(token) {
        try {
            logger_1.logger.info(`Refresh token revoked: ${token.substring(0, 10)}...`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error revoking refresh token:', error);
            return false;
        }
    }
    async isTokenBlacklisted(_token) {
        try {
            return false;
        }
        catch (error) {
            logger_1.logger.error('Error checking token blacklist:', error);
            return false;
        }
    }
    getTokenExpiry(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error getting token expiry:', error);
            return null;
        }
    }
}
exports.refreshTokenService = new RefreshTokenService();
exports.default = exports.refreshTokenService;
//# sourceMappingURL=refreshToken.service.js.map