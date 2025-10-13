// Security middleware - Created by Balaji Koneti
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Interface for security configuration
interface SecurityConfig {
  maxRequestsPerWindow: number;
  windowMs: number;
  maxRequestSize: number;
  allowedFileTypes: string[];
  maxFileSize: number;
}

// Security configuration
const securityConfig: SecurityConfig = {
  maxRequestsPerWindow: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
  maxFileSize: 5 * 1024 * 1024 // 5MB
};

/**
 * Enhanced rate limiting middleware
 */
export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || securityConfig.windowMs,
    max: options.max || securityConfig.maxRequestsPerWindow,
    message: options.message || {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((options.windowMs || securityConfig.windowMs) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((options.windowMs || securityConfig.windowMs) / 1000)
      });
    }
  });
};

/**
 * Request size limiting middleware
 */
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  
  if (contentLength > securityConfig.maxRequestSize) {
    logger.warn(`Request size limit exceeded: ${contentLength} bytes from IP: ${req.ip}`);
    res.status(413).json({
      success: false,
      message: 'Request entity too large',
      maxSize: securityConfig.maxRequestSize
    });
    return;
  }
  
  next();
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize string inputs
    const sanitizeString = (str: string): string => {
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    };

    // Recursively sanitize object
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();

  } catch (error) {
    logger.error('Error in input sanitization:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid input data'
    });
  }
};

/**
 * SQL injection prevention middleware
 */
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(UNION\s+SELECT)/gi,
      /(DROP\s+TABLE)/gi,
      /(DELETE\s+FROM)/gi,
      /(INSERT\s+INTO)/gi,
      /(UPDATE\s+SET)/gi,
      /(ALTER\s+TABLE)/gi,
      /(CREATE\s+TABLE)/gi,
      /(EXEC\s*\()/gi
    ];

    const checkForInjection = (value: any): boolean => {
      if (typeof value === 'string') {
        return dangerousPatterns.some(pattern => pattern.test(value));
      } else if (Array.isArray(value)) {
        return value.some(checkForInjection);
      } else if (value && typeof value === 'object') {
        return Object.values(value).some(checkForInjection);
      }
      return false;
    };

    // Check request body
    if (req.body && checkForInjection(req.body)) {
      logger.warn(`Potential SQL injection attempt from IP: ${req.ip}`);
      res.status(400).json({
        success: false,
        message: 'Invalid input detected'
      });
      return;
    }

    // Check query parameters
    if (req.query && checkForInjection(req.query)) {
      logger.warn(`Potential SQL injection attempt in query from IP: ${req.ip}`);
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters'
      });
      return;
    }

    // Check URL parameters
    if (req.params && checkForInjection(req.params)) {
      logger.warn(`Potential SQL injection attempt in params from IP: ${req.ip}`);
      res.status(400).json({
        success: false,
        message: 'Invalid URL parameters'
      });
      return;
    }

    next();

  } catch (error) {
    logger.error('Error in SQL injection prevention:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * XSS prevention middleware
 */
export const preventXSS = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
      /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi
    ];

    const checkForXSS = (value: any): boolean => {
      if (typeof value === 'string') {
        return xssPatterns.some(pattern => pattern.test(value));
      } else if (Array.isArray(value)) {
        return value.some(checkForXSS);
      } else if (value && typeof value === 'object') {
        return Object.values(value).some(checkForXSS);
      }
      return false;
    };

    // Check request body
    if (req.body && checkForXSS(req.body)) {
      logger.warn(`Potential XSS attempt from IP: ${req.ip}`);
      res.status(400).json({
        success: false,
        message: 'Invalid input detected'
      });
      return;
    }

    // Check query parameters
    if (req.query && checkForXSS(req.query)) {
      logger.warn(`Potential XSS attempt in query from IP: ${req.ip}`);
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters'
      });
      return;
    }

    next();

  } catch (error) {
    logger.error('Error in XSS prevention:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * File upload security middleware
 */
export const secureFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Check if request has file uploads
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : [req.files];
      
      for (const file of files) {
        // Check file size
        if (file.size > securityConfig.maxFileSize) {
          logger.warn(`File size limit exceeded: ${file.size} bytes from IP: ${req.ip}`);
          res.status(413).json({
            success: false,
            message: 'File too large',
            maxSize: securityConfig.maxFileSize
          });
          return;
        }

        // Check file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !securityConfig.allowedFileTypes.includes(`.${fileExtension}`)) {
          logger.warn(`Invalid file type: ${fileExtension} from IP: ${req.ip}`);
          res.status(400).json({
            success: false,
            message: 'Invalid file type',
            allowedTypes: securityConfig.allowedFileTypes
          });
          return;
        }

        // Check for malicious file content
        if (file.mimetype && file.mimetype.includes('script')) {
          logger.warn(`Potentially malicious file upload from IP: ${req.ip}`);
          res.status(400).json({
            success: false,
            message: 'File type not allowed'
          });
          return;
        }
      }
    }

    next();

  } catch (error) {
    logger.error('Error in file upload security:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Request logging middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request
  logger.info(`Request: ${req.method} ${req.path} from IP: ${req.ip}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`Response: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });

  next();
};

/**
 * IP whitelist middleware (for admin endpoints)
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP || '')) {
      logger.warn(`Unauthorized IP access attempt: ${clientIP}`);
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
      return;
    }
    
    next();
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};
