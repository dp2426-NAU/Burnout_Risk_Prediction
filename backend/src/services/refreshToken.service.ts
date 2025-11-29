// Refresh Token Service - Created by Harish S & Team
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env';
import { logger } from '../utils/logger';

// Interface for refresh token payload
interface RefreshTokenPayload {
  userId: string;
  email: string;
  type: 'refresh';
}

// Interface for refresh token response
export interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

// Interface for token validation
export interface TokenValidation {
  valid: boolean;
  payload?: any;
  error?: string;
}

class RefreshTokenService {
  private readonly refreshTokenExpiry: SignOptions['expiresIn'] = '7d'; // Refresh tokens last 7 days
  private readonly accessTokenExpiry = JWT_EXPIRES_IN as SignOptions['expiresIn'];

  /**
   * Generate a new refresh token
   */
  generateRefreshToken(userId: string, email: string): string {
    try {
      const payload: RefreshTokenPayload = {
        userId,
        email,
        type: 'refresh'
      };

      const signOptions: SignOptions = {
        expiresIn: this.refreshTokenExpiry
      };

      const refreshToken = jwt.sign(payload, JWT_SECRET as Secret, signOptions);

      logger.info(`Refresh token generated for user: ${email}`);
      return refreshToken;

    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate a new access token
   */
  generateAccessToken(userId: string, email: string, role: string): string {
    try {
      const payload = {
        userId,
        email,
        role,
        type: 'access'
      };

      const signOptions: SignOptions = {
        expiresIn: this.accessTokenExpiry
      };

      const accessToken = jwt.sign(payload, JWT_SECRET as Secret, signOptions);

      logger.info(`Access token generated for user: ${email}`);
      return accessToken;

    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Validate refresh token
   */
  validateRefreshToken(token: string): TokenValidation {
    try {
      const decoded = jwt.verify(token, JWT_SECRET as Secret) as any;
      
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

    } catch (error) {
      logger.warn('Invalid refresh token:', error);
      return {
        valid: false,
        error: 'Invalid or expired refresh token'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    userRole: string
  ): Promise<RefreshTokenResponse> {
    try {
      // Validate refresh token
      const validation = this.validateRefreshToken(refreshToken);
      
      if (!validation.valid || !validation.payload) {
        return {
          success: false,
          message: validation.error || 'Invalid refresh token'
        };
      }

      const { userId, email } = validation.payload;

      // Generate new access token
      const newAccessToken = this.generateAccessToken(userId, email, userRole);

      // Optionally generate new refresh token (token rotation)
      const newRefreshToken = this.generateRefreshToken(userId, email);

      logger.info(`Tokens refreshed for user: ${email}`);

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      logger.error('Error refreshing access token:', error);
      return {
        success: false,
        message: 'Failed to refresh access token'
      };
    }
  }

  /**
   * Revoke refresh token (blacklist)
   */
  async revokeRefreshToken(token: string): Promise<boolean> {
    try {
      // In a production system, you would store revoked tokens in a blacklist
      // For now, we'll just log the revocation
      logger.info(`Refresh token revoked: ${token.substring(0, 10)}...`);
      return true;

    } catch (error) {
      logger.error('Error revoking refresh token:', error);
      return false;
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      // In a production system, you would check against a blacklist database
      // For now, we'll return false (not blacklisted)
      return false;

    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      return false;
    }
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;

    } catch (error) {
      logger.error('Error getting token expiry:', error);
      return null;
    }
  }
}

// Export singleton instance
export const refreshTokenService = new RefreshTokenService();
export default refreshTokenService;
