// Monitoring and metrics collection middleware - Created by Harish S & Team
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache.service';
import { checkDatabaseHealth, getConnectionStats } from '../config/database';

// Metrics collection interface
interface Metrics {
  timestamp: number;
  requestCount: number;
  responseTime: number;
  statusCode: number;
  endpoint: string;
  method: string;
  userAgent: string;
  ip: string;
  memoryUsage: NodeJS.MemoryUsage;
  databaseConnected: boolean;
  cacheConnected: boolean;
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  RESPONSE_TIME: 2000, // 2 seconds
  MEMORY_USAGE: 500 * 1024 * 1024, // 500MB
  ERROR_RATE: 0.1, // 10%
  DATABASE_DISCONNECTED: true,
  CACHE_DISCONNECTED: true,
} as const;

// Metrics storage
const metrics: Metrics[] = [];
const errorCounts = new Map<string, number>();
const requestCounts = new Map<string, number>();

/**
 * Enhanced health check middleware
 */
export const enhancedHealthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const healthData = await getSystemHealth();
    
    // Set health status
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
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Metrics collection middleware
 */
export const metricsCollection = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  // Add request ID to response
  res.set('X-Request-ID', requestId);
  
  // Override end method to collect metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Collect metrics
    const metric: Metrics = {
      timestamp: Date.now(),
      requestCount: 1,
      responseTime,
      statusCode: res.statusCode,
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent') || 'unknown',
      ip: req.ip || 'unknown',
      memoryUsage: process.memoryUsage(),
      databaseConnected: false, // Will be updated by health check
      cacheConnected: false, // Will be updated by health check
    };
    
    // Update request counts
    const endpointKey = `${req.method}:${req.path}`;
    requestCounts.set(endpointKey, (requestCounts.get(endpointKey) || 0) + 1);
    
    // Update error counts
    if (res.statusCode >= 400) {
      errorCounts.set(endpointKey, (errorCounts.get(endpointKey) || 0) + 1);
    }
    
    // Store metrics (keep only last 1000 entries)
    metrics.push(metric);
    if (metrics.length > 1000) {
      metrics.shift();
    }
    
    // Log slow requests
    if (responseTime > ALERT_THRESHOLDS.RESPONSE_TIME) {
      logger.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
    }
    
    // Log high memory usage
    if (metric.memoryUsage.heapUsed > ALERT_THRESHOLDS.MEMORY_USAGE) {
      logger.warn(`High memory usage detected: ${Math.round(metric.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Structured logging middleware
 */
export const structuredLogging = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  // Log request
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  
  // Override end method to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      responseSize: chunk ? chunk.length : 0,
      timestamp: new Date().toISOString(),
    });
    
    // Log errors
    if (res.statusCode >= 400) {
      logger.error('Request failed', {
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

/**
 * Alerting middleware
 */
export const alerting = (req: Request, res: Response, next: NextFunction): void => {
  // Check for alert conditions
  setInterval(async () => {
    await checkAlertConditions();
  }, 30000); // Check every 30 seconds
  
  next();
};

/**
 * Get system health status
 */
async function getSystemHealth(): Promise<any> {
  try {
    // Check database health
    const databaseHealth = await checkDatabaseHealth();
    const databaseStats = getConnectionStats();
    
    // Check cache health
    const cacheHealth = await cacheService.healthCheck();
    const cacheStats = await cacheService.getCacheStats();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    // Check error rates
    const totalRequests = Array.from(requestCounts.values()).reduce((a, b) => a + b, 0);
    const totalErrors = Array.from(errorCounts.values()).reduce((a, b) => a + b, 0);
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    
    // Determine overall health
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
  } catch (error: unknown) {
    logger.error('Error getting system health:', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check alert conditions
 */
async function checkAlertConditions(): Promise<void> {
  try {
    // Check database connection
    const databaseHealth = await checkDatabaseHealth();
    if (!databaseHealth) {
      await sendAlert('Database connection lost', 'critical');
    }
    
    // Check cache connection
    const cacheHealth = await cacheService.healthCheck();
    if (!cacheHealth) {
      await sendAlert('Cache connection lost', 'warning');
    }
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    if (memoryUsageMB > 1000) {
      await sendAlert(`High memory usage: ${memoryUsageMB}MB`, 'warning');
    }
    
    // Check error rate
    const totalRequests = Array.from(requestCounts.values()).reduce((a, b) => a + b, 0);
    const totalErrors = Array.from(errorCounts.values()).reduce((a, b) => a + b, 0);
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    
    if (errorRate > ALERT_THRESHOLDS.ERROR_RATE) {
      await sendAlert(`High error rate: ${Math.round(errorRate * 100)}%`, 'critical');
    }
    
    // Check response times
    const avgResponseTime = getAverageResponseTime();
    if (avgResponseTime > ALERT_THRESHOLDS.RESPONSE_TIME) {
      await sendAlert(`High response time: ${avgResponseTime}ms`, 'warning');
    }
    
  } catch (error: unknown) {
    logger.error('Error checking alert conditions:', error);
  }
}

/**
 * Send alert notification
 */
async function sendAlert(message: string, severity: 'info' | 'warning' | 'critical'): Promise<void> {
  try {
    const alertData = {
      message,
      severity,
      timestamp: new Date().toISOString(),
      service: 'burnout-prediction-backend',
      environment: process.env.NODE_ENV || 'development',
    };
    
    // Log alert
    logger[severity === 'critical' ? 'error' : 'warn']('Alert triggered', alertData);
    
    // Here you would integrate with your alerting system
    // Examples: Slack, PagerDuty, email, etc.
    
    // For now, we'll just log the alert
    console.log(`🚨 ALERT [${severity.toUpperCase()}]: ${message}`);
    
  } catch (error) {
    logger.error('Error sending alert:', error);
  }
}

/**
 * Get average response time
 */
function getAverageResponseTime(): number {
  if (metrics.length === 0) {
    return 0;
  }
  
  const totalTime = metrics.reduce((sum, metric) => sum + metric.responseTime, 0);
  return Math.round(totalTime / metrics.length);
}

/**
 * Get metrics summary
 */
export function getMetricsSummary(): any {
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
  const averageResponseTime = Math.round(
    recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
  );
  
  const errors = recentMetrics.filter(m => m.statusCode >= 400).length;
  const errorRate = Math.round((errors / totalRequests) * 100) / 100;
  
  // Top endpoints
  const endpointCounts = new Map<string, number>();
  recentMetrics.forEach(m => {
    const key = `${m.method} ${m.endpoint}`;
    endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
  });
  
  const topEndpoints = Array.from(endpointCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));
  
  // Status code distribution
  const statusCodes: Record<number, number> = {};
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

/**
 * Clear metrics
 */
export function clearMetrics(): void {
  metrics.length = 0;
  errorCounts.clear();
  requestCounts.clear();
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get detailed metrics for monitoring dashboard
 */
export function getDetailedMetrics(): any {
  return {
    metrics: metrics.slice(-100), // Last 100 metrics
    errorCounts: Object.fromEntries(errorCounts),
    requestCounts: Object.fromEntries(requestCounts),
    summary: getMetricsSummary(),
    health: {
      database: getConnectionStats(),
      cache: cacheService.isRedisConnected(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    },
  };
}
