import { NextFunction, Response } from 'express';
import { verifyToken } from '../services/auth.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './rbac.middleware';

export function authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Error authenticating request', error);
    res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
}

