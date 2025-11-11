"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alerting = exports.structuredLogging = exports.metricsCollection = exports.enhancedHealthCheck = void 0;
exports.getMetricsSummary = getMetricsSummary;
exports.clearMetrics = clearMetrics;
exports.getDetailedMetrics = getDetailedMetrics;
const logger_1 = require("../utils/logger");
const cache_service_1 = require("../services/cache.service");
const database_1 = require("../config/database");
const ALERT_THRESHOLDS = {
    RESPONSE_TIME: 2000,
    MEMORY_USAGE: 500 * 1024 * 1024,
    ERROR_RATE: 0.1,
    DATABASE_DISCONNECTED: true,
    CACHE_DISCONNECTED: true,
};
const metrics = [];
const errorCounts = new Map();
const requestCounts = new Map();
const enhancedHealthCheck = async (req, res, next) => {
    try {
        const healthData = await getSystemHealth();
        const isHealthy = healthData.status === 'healthy';
        const statusCode = isHealthy ? 200 : 503;
        res.status(statusCode).json({
            status: healthData.status,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: healthData.services,
            metrics: healthData.metrics,
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: 'Health check failed',
            timestamp: new Date().toISOString(),
        });
    }
};
exports.enhancedHealthCheck = enhancedHealthCheck;
const metricsCollection = (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || generateRequestId();
    res.set('X-Request-ID', requestId);
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const metric = {
            timestamp: Date.now(),
            requestCount: 1,
            responseTime,
            statusCode: res.statusCode,
            endpoint: req.path,
            method: req.method,
            userAgent: req.get('User-Agent') || 'unknown',
            ip: req.ip || 'unknown',
            memoryUsage: process.memoryUsage(),
            databaseConnected: false,
            cacheConnected: false,
        };
        const endpointKey = `${req.method}:${req.path}`;
        requestCounts.set(endpointKey, (requestCounts.get(endpointKey) || 0) + 1);
        if (res.statusCode >= 400) {
            errorCounts.set(endpointKey, (errorCounts.get(endpointKey) || 0) + 1);
        }
        metrics.push(metric);
        if (metrics.length > 1000) {
            metrics.shift();
        }
        if (responseTime > ALERT_THRESHOLDS.RESPONSE_TIME) {
            logger_1.logger.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
        }
        if (metric.memoryUsage.heapUsed > ALERT_THRESHOLDS.MEMORY_USAGE) {
            logger_1.logger.warn(`High memory usage detected: ${Math.round(metric.memoryUsage.heapUsed / 1024 / 1024)}MB`);
        }
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.metricsCollection = metricsCollection;
const structuredLogging = (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || generateRequestId();
    logger_1.logger.info('Request started', {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        logger_1.logger.info('Request completed', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            responseSize: chunk ? chunk.length : 0,
            timestamp: new Date().toISOString(),
        });
        if (res.statusCode >= 400) {
            logger_1.logger.error('Request failed', {
                requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                error: res.statusMessage,
                timestamp: new Date().toISOString(),
            });
        }
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.structuredLogging = structuredLogging;
const alerting = (req, res, next) => {
    setInterval(async () => {
        await checkAlertConditions();
    }, 30000);
    next();
};
exports.alerting = alerting;
async function getSystemHealth() {
    try {
        const databaseHealth = await (0, database_1.checkDatabaseHealth)();
        const databaseStats = (0, database_1.getConnectionStats)();
        const cacheHealth = await cache_service_1.cacheService.healthCheck();
        const cacheStats = await cache_service_1.cacheService.getCacheStats();
        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const totalRequests = Array.from(requestCounts.values()).reduce((a, b) => a + b, 0);
        const totalErrors = Array.from(errorCounts.values()).reduce((a, b) => a + b, 0);
        const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
        const isHealthy = databaseHealth &&
            cacheHealth &&
            memoryUsageMB < 1000 &&
            errorRate < ALERT_THRESHOLDS.ERROR_RATE;
        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            services: {
                database: {
                    status: databaseHealth ? 'healthy' : 'unhealthy',
                    connected: databaseStats.isConnected,
                    host: databaseStats.host,
                    port: databaseStats.port,
                },
                cache: {
                    status: cacheHealth ? 'healthy' : 'unhealthy',
                    connected: cacheStats?.connected || false,
                    memory: cacheStats?.memory || null,
                },
                application: {
                    status: 'healthy',
                    uptime: process.uptime(),
                    memoryUsage: memoryUsageMB,
                    nodeVersion: process.version,
                },
            },
            metrics: {
                totalRequests,
                totalErrors,
                errorRate: Math.round(errorRate * 100) / 100,
                averageResponseTime: getAverageResponseTime(),
                memoryUsage: memoryUsageMB,
                activeConnections: databaseStats.retryCount,
            },
        };
    }
    catch (error) {
        logger_1.logger.error('Error getting system health:', error);
        return {
            status: 'unhealthy',
            error: error.message,
        };
    }
}
async function checkAlertConditions() {
    try {
        const databaseHealth = await (0, database_1.checkDatabaseHealth)();
        if (!databaseHealth) {
            await sendAlert('Database connection lost', 'critical');
        }
        const cacheHealth = await cache_service_1.cacheService.healthCheck();
        if (!cacheHealth) {
            await sendAlert('Cache connection lost', 'warning');
        }
        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        if (memoryUsageMB > 1000) {
            await sendAlert(`High memory usage: ${memoryUsageMB}MB`, 'warning');
        }
        const totalRequests = Array.from(requestCounts.values()).reduce((a, b) => a + b, 0);
        const totalErrors = Array.from(errorCounts.values()).reduce((a, b) => a + b, 0);
        const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
        if (errorRate > ALERT_THRESHOLDS.ERROR_RATE) {
            await sendAlert(`High error rate: ${Math.round(errorRate * 100)}%`, 'critical');
        }
        const avgResponseTime = getAverageResponseTime();
        if (avgResponseTime > ALERT_THRESHOLDS.RESPONSE_TIME) {
            await sendAlert(`High response time: ${avgResponseTime}ms`, 'warning');
        }
    }
    catch (error) {
        logger_1.logger.error('Error checking alert conditions:', error);
    }
}
async function sendAlert(message, severity) {
    try {
        const alertData = {
            message,
            severity,
            timestamp: new Date().toISOString(),
            service: 'burnout-prediction-backend',
            environment: process.env.NODE_ENV || 'development',
        };
        logger_1.logger[severity === 'critical' ? 'error' : 'warn']('Alert triggered', alertData);
        console.log(`🚨 ALERT [${severity.toUpperCase()}]: ${message}`);
    }
    catch (error) {
        logger_1.logger.error('Error sending alert:', error);
    }
}
function getAverageResponseTime() {
    if (metrics.length === 0) {
        return 0;
    }
    const totalTime = metrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return Math.round(totalTime / metrics.length);
}
function getMetricsSummary() {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    const recentMetrics = metrics.filter(m => m.timestamp > lastHour);
    if (recentMetrics.length === 0) {
        return {
            totalRequests: 0,
            averageResponseTime: 0,
            errorRate: 0,
            topEndpoints: [],
            statusCodes: {},
        };
    }
    const totalRequests = recentMetrics.length;
    const averageResponseTime = Math.round(recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests);
    const errors = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = Math.round((errors / totalRequests) * 100) / 100;
    const endpointCounts = new Map();
    recentMetrics.forEach(m => {
        const key = `${m.method} ${m.endpoint}`;
        endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
    });
    const topEndpoints = Array.from(endpointCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }));
    const statusCodes = {};
    recentMetrics.forEach(m => {
        statusCodes[m.statusCode] = (statusCodes[m.statusCode] || 0) + 1;
    });
    return {
        totalRequests,
        averageResponseTime,
        errorRate,
        topEndpoints,
        statusCodes,
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        uptime: process.uptime(),
    };
}
function clearMetrics() {
    metrics.length = 0;
    errorCounts.clear();
    requestCounts.clear();
}
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function getDetailedMetrics() {
    return {
        metrics: metrics.slice(-100),
        errorCounts: Object.fromEntries(errorCounts),
        requestCounts: Object.fromEntries(requestCounts),
        summary: getMetricsSummary(),
        health: {
            database: (0, database_1.getConnectionStats)(),
            cache: cache_service_1.cacheService.isRedisConnected(),
            memory: process.memoryUsage(),
            uptime: process.uptime(),
        },
    };
}
//# sourceMappingURL=monitoring.middleware.js.map