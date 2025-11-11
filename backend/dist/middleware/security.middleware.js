"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = exports.ipWhitelist = exports.securityLogger = exports.secureFileUpload = exports.preventXSS = exports.preventSQLInjection = exports.sanitizeInput = exports.requestSizeLimit = exports.createRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../utils/logger");
const securityConfig = {
    maxRequestsPerWindow: 100,
    windowMs: 15 * 60 * 1000,
    maxRequestSize: 10 * 1024 * 1024,
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
    maxFileSize: 5 * 1024 * 1024
};
const createRateLimit = (options) => {
    return (0, express_rate_limit_1.default)({
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
            logger_1.logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
            res.status(429).json({
                success: false,
                message: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil((options.windowMs || securityConfig.windowMs) / 1000)
            });
        }
    });
};
exports.createRateLimit = createRateLimit;
const requestSizeLimit = (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > securityConfig.maxRequestSize) {
        logger_1.logger.warn(`Request size limit exceeded: ${contentLength} bytes from IP: ${req.ip}`);
        res.status(413).json({
            success: false,
            message: 'Request entity too large',
            maxSize: securityConfig.maxRequestSize
        });
        return;
    }
    next();
};
exports.requestSizeLimit = requestSizeLimit;
const sanitizeInput = (req, res, next) => {
    try {
        const sanitizeString = (str) => {
            return str
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        };
        const sanitizeObject = (obj) => {
            if (typeof obj === 'string') {
                return sanitizeString(obj);
            }
            else if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }
            else if (obj && typeof obj === 'object') {
                const sanitized = {};
                for (const key in obj) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
                return sanitized;
            }
            return obj;
        };
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in input sanitization:', error);
        res.status(400).json({
            success: false,
            message: 'Invalid input data'
        });
    }
};
exports.sanitizeInput = sanitizeInput;
const preventSQLInjection = (req, res, next) => {
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
        const checkForInjection = (value) => {
            if (typeof value === 'string') {
                return dangerousPatterns.some(pattern => pattern.test(value));
            }
            else if (Array.isArray(value)) {
                return value.some(checkForInjection);
            }
            else if (value && typeof value === 'object') {
                return Object.values(value).some(checkForInjection);
            }
            return false;
        };
        if (req.body && checkForInjection(req.body)) {
            logger_1.logger.warn(`Potential SQL injection attempt from IP: ${req.ip}`);
            res.status(400).json({
                success: false,
                message: 'Invalid input detected'
            });
            return;
        }
        if (req.query && checkForInjection(req.query)) {
            logger_1.logger.warn(`Potential SQL injection attempt in query from IP: ${req.ip}`);
            res.status(400).json({
                success: false,
                message: 'Invalid query parameters'
            });
            return;
        }
        if (req.params && checkForInjection(req.params)) {
            logger_1.logger.warn(`Potential SQL injection attempt in params from IP: ${req.ip}`);
            res.status(400).json({
                success: false,
                message: 'Invalid URL parameters'
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in SQL injection prevention:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.preventSQLInjection = preventSQLInjection;
const preventXSS = (req, res, next) => {
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
        const checkForXSS = (value) => {
            if (typeof value === 'string') {
                return xssPatterns.some(pattern => pattern.test(value));
            }
            else if (Array.isArray(value)) {
                return value.some(checkForXSS);
            }
            else if (value && typeof value === 'object') {
                return Object.values(value).some(checkForXSS);
            }
            return false;
        };
        if (req.body && checkForXSS(req.body)) {
            logger_1.logger.warn(`Potential XSS attempt from IP: ${req.ip}`);
            res.status(400).json({
                success: false,
                message: 'Invalid input detected'
            });
            return;
        }
        if (req.query && checkForXSS(req.query)) {
            logger_1.logger.warn(`Potential XSS attempt in query from IP: ${req.ip}`);
            res.status(400).json({
                success: false,
                message: 'Invalid query parameters'
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in XSS prevention:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.preventXSS = preventXSS;
const secureFileUpload = (req, res, next) => {
    try {
        if (req.files) {
            const files = Array.isArray(req.files) ? req.files : [req.files];
            for (const file of files) {
                if (file.size > securityConfig.maxFileSize) {
                    logger_1.logger.warn(`File size limit exceeded: ${file.size} bytes from IP: ${req.ip}`);
                    res.status(413).json({
                        success: false,
                        message: 'File too large',
                        maxSize: securityConfig.maxFileSize
                    });
                    return;
                }
                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                if (!fileExtension || !securityConfig.allowedFileTypes.includes(`.${fileExtension}`)) {
                    logger_1.logger.warn(`Invalid file type: ${fileExtension} from IP: ${req.ip}`);
                    res.status(400).json({
                        success: false,
                        message: 'Invalid file type',
                        allowedTypes: securityConfig.allowedFileTypes
                    });
                    return;
                }
                if (file.mimetype && file.mimetype.includes('script')) {
                    logger_1.logger.warn(`Potentially malicious file upload from IP: ${req.ip}`);
                    res.status(400).json({
                        success: false,
                        message: 'File type not allowed'
                    });
                    return;
                }
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in file upload security:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.secureFileUpload = secureFileUpload;
const securityLogger = (req, res, next) => {
    const startTime = Date.now();
    logger_1.logger.info(`Request: ${req.method} ${req.path} from IP: ${req.ip}`, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        logger_1.logger[logLevel](`Response: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
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
exports.securityLogger = securityLogger;
const ipWhitelist = (allowedIPs) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!allowedIPs.includes(clientIP || '')) {
            logger_1.logger.warn(`Unauthorized IP access attempt: ${clientIP}`);
            res.status(403).json({
                success: false,
                message: 'Access denied from this IP address'
            });
            return;
        }
        next();
    };
};
exports.ipWhitelist = ipWhitelist;
const securityHeaders = (req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
};
exports.securityHeaders = securityHeaders;
//# sourceMappingURL=security.middleware.js.map