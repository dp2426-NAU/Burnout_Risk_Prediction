"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryMonitoring = exports.databaseOptimization = exports.performanceMonitoring = exports.responseSizeOptimization = exports.queryOptimization = exports.apiResponseCache = exports.responseCompression = void 0;
exports.getPerformanceMetrics = getPerformanceMetrics;
exports.clearPerformanceMetrics = clearPerformanceMetrics;
exports.getPerformanceStats = getPerformanceStats;
const compression_1 = __importDefault(require("compression"));
const logger_1 = require("../utils/logger");
const cache_service_1 = require("../services/cache.service");
const requestMetrics = new Map();
exports.responseCompression = (0, compression_1.default)({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    }
});
const apiResponseCache = (ttlSeconds = 300) => {
    return async (req, res, next) => {
        try {
            if (req.method !== 'GET') {
                next();
                return;
            }
            const cacheKey = generateCacheKey(req);
            const cachedResponse = await cache_service_1.cacheService.getApiResponse(req.path, req.query);
            if (cachedResponse) {
                logger_1.logger.debug(`Cache hit for ${req.path}`);
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-TTL', ttlSeconds.toString());
                res.json(cachedResponse);
                return;
            }
            const originalJson = res.json;
            res.json = function (body) {
                cache_service_1.cacheService.setApiResponse(req.path, req.query, body);
                res.set('X-Cache', 'MISS');
                res.set('X-Cache-TTL', ttlSeconds.toString());
                res.set('Cache-Control', `public, max-age=${ttlSeconds}`);
                return originalJson.call(this, body);
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('Error in API response cache middleware:', error);
            next();
        }
    };
};
exports.apiResponseCache = apiResponseCache;
const queryOptimization = (req, res, next) => {
    try {
        res.set('X-Query-Optimization', 'enabled');
        if (req.query.page && req.query.limit) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            res.set('X-Pagination-Page', page.toString());
            res.set('X-Pagination-Limit', limit.toString());
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in query optimization middleware:', error);
        next();
    }
};
exports.queryOptimization = queryOptimization;
const responseSizeOptimization = (req, res, next) => {
    try {
        const originalJson = res.json;
        const originalSend = res.send;
        res.json = function (body) {
            const optimizedBody = optimizeResponseSize(body);
            const size = JSON.stringify(optimizedBody).length;
            res.set('X-Response-Size', size.toString());
            if (size > 1024 * 1024) {
                res.set('X-Response-Large', 'true');
                logger_1.logger.warn(`Large response detected: ${size} bytes for ${req.path}`);
            }
            return originalJson.call(this, optimizedBody);
        };
        res.send = function (body) {
            const size = typeof body === 'string' ? body.length : JSON.stringify(body).length;
            res.set('X-Response-Size', size.toString());
            if (size > 1024 * 1024) {
                res.set('X-Response-Large', 'true');
                logger_1.logger.warn(`Large response detected: ${size} bytes for ${req.path}`);
            }
            return originalSend.call(this, body);
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in response size optimization middleware:', error);
        next();
    }
};
exports.responseSizeOptimization = responseSizeOptimization;
const performanceMonitoring = (req, res, next) => {
    try {
        const requestId = generateRequestId();
        const startTime = Date.now();
        const metrics = {
            requestId,
            method: req.method,
            path: req.path,
            startTime,
        };
        requestMetrics.set(requestId, metrics);
        res.set('X-Request-ID', requestId);
        const originalEnd = res.end;
        res.end = function (chunk, encoding) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            metrics.endTime = endTime;
            metrics.duration = duration;
            metrics.statusCode = res.statusCode;
            if (duration > 1000) {
                logger_1.logger.warn(`Slow request detected: ${req.method} ${req.path} - ${duration}ms`);
            }
            logger_1.logger.info(`Request completed: ${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);
            requestMetrics.delete(requestId);
            return originalEnd.call(this, chunk, encoding);
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in performance monitoring middleware:', error);
        next();
    }
};
exports.performanceMonitoring = performanceMonitoring;
const databaseOptimization = (req, res, next) => {
    try {
        res.set('X-Database-Optimization', 'enabled');
        if (req.path.includes('/predictions') && req.method === 'GET') {
            res.set('X-Query-Hint', 'use-index:userId_1_predictionDate_-1');
        }
        if (req.path.includes('/users') && req.method === 'GET') {
            res.set('X-Query-Hint', 'use-index:email_1');
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in database optimization middleware:', error);
        next();
    }
};
exports.databaseOptimization = databaseOptimization;
const memoryMonitoring = (req, res, next) => {
    try {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        res.set('X-Memory-Heap-Used', heapUsedMB.toString());
        res.set('X-Memory-Heap-Total', heapTotalMB.toString());
        if (heapUsedMB > 500) {
            logger_1.logger.warn(`High memory usage detected: ${heapUsedMB}MB`);
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error in memory monitoring middleware:', error);
        next();
    }
};
exports.memoryMonitoring = memoryMonitoring;
function generateCacheKey(req) {
    const queryString = Object.keys(req.query)
        .sort()
        .map(key => `${key}=${req.query[key]}`)
        .join('&');
    return `${req.method}:${req.path}:${queryString}`;
}
function optimizeResponseSize(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }
    const optimized = JSON.parse(JSON.stringify(body, (key, value) => {
        if (value === null || value === undefined) {
            return undefined;
        }
        return value;
    }));
    if (Array.isArray(optimized) && optimized.length > 100) {
        return optimized.slice(0, 100);
    }
    return optimized;
}
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function getPerformanceMetrics() {
    return Array.from(requestMetrics.values());
}
function clearPerformanceMetrics() {
    requestMetrics.clear();
}
function getPerformanceStats() {
    const metrics = Array.from(requestMetrics.values());
    const completedMetrics = metrics.filter(m => m.duration !== undefined);
    if (completedMetrics.length === 0) {
        return {
            totalRequests: 0,
            averageResponseTime: 0,
            slowestRequest: null,
            fastestRequest: null,
        };
    }
    const durations = completedMetrics.map(m => m.duration);
    const averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    return {
        totalRequests: completedMetrics.length,
        averageResponseTime: Math.round(averageResponseTime),
        slowestRequest: Math.max(...durations),
        fastestRequest: Math.min(...durations),
        requestsByStatus: completedMetrics.reduce((acc, m) => {
            acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
            return acc;
        }, {}),
    };
}
//# sourceMappingURL=performance.middleware.js.map