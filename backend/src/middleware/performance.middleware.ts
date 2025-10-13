// Performance optimization middleware - Created by Balaji Koneti
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache.service';

// Performance metrics interface
interface PerformanceMetrics {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  responseSize?: number;
  cacheHit?: boolean;
}

// Request tracking map
const requestMetrics = new Map<string, PerformanceMetrics>();

/**
 * Response compression middleware
 */
export const responseCompression = compression({
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Use compression filter
    return compression.filter(req, res);
  }
});

/**
 * API response caching middleware
 */
export const apiResponseCache = (ttlSeconds: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Only cache GET requests
      if (req.method !== 'GET') {
        next();
        return;
      }

      // Generate cache key
      const cacheKey = generateCacheKey(req);
      
      // Check cache
      const cachedResponse = await cacheService.getApiResponse(req.path, req.query);
      
      if (cachedResponse) {
        logger.debug(`Cache hit for ${req.path}`);
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-TTL', ttlSeconds.toString());
        res.json(cachedResponse);
        return;
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(body: any) {
        // Cache the response
        cacheService.setApiResponse(req.path, req.query, body);
        
        // Set cache headers
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-TTL', ttlSeconds.toString());
        res.set('Cache-Control', `public, max-age=${ttlSeconds}`);
        
        // Call original json method
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Error in API response cache middleware:', error);
      next();
    }
  };
};

/**
 * Database query optimization middleware
 */
export const queryOptimization = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Add query optimization headers
    res.set('X-Query-Optimization', 'enabled');
    
    // Add pagination headers if applicable
    if (req.query.page && req.query.limit) {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      res.set('X-Pagination-Page', page.toString());
      res.set('X-Pagination-Limit', limit.toString());
    }
    
    next();
  } catch (error) {
    logger.error('Error in query optimization middleware:', error);
    next();
  }
};

/**
 * Response size optimization middleware
 */
export const responseSizeOptimization = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override json method
    res.json = function(body: any) {
      // Optimize response size
      const optimizedBody = optimizeResponseSize(body);
      
      // Add size headers
      const size = JSON.stringify(optimizedBody).length;
      res.set('X-Response-Size', size.toString());
      
      if (size > 1024 * 1024) { // 1MB
        res.set('X-Response-Large', 'true');
        logger.warn(`Large response detected: ${size} bytes for ${req.path}`);
      }
      
      return originalJson.call(this, optimizedBody);
    };
    
    // Override send method
    res.send = function(body: any) {
      const size = typeof body === 'string' ? body.length : JSON.stringify(body).length;
      res.set('X-Response-Size', size.toString());
      
      if (size > 1024 * 1024) { // 1MB
        res.set('X-Response-Large', 'true');
        logger.warn(`Large response detected: ${size} bytes for ${req.path}`);
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  } catch (error) {
    logger.error('Error in response size optimization middleware:', error);
    next();
  }
};

/**
 * Performance monitoring middleware
 */
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Store request metrics
    const metrics: PerformanceMetrics = {
      requestId,
      method: req.method,
      path: req.path,
      startTime,
    };
    
    requestMetrics.set(requestId, metrics);
    
    // Add request ID to response headers
    res.set('X-Request-ID', requestId);
    
    // Override end method to capture performance metrics
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Update metrics
      metrics.endTime = endTime;
      metrics.duration = duration;
      metrics.statusCode = res.statusCode;
      
      // Log performance metrics
      if (duration > 1000) { // Log slow requests (>1s)
        logger.warn(`Slow request detected: ${req.method} ${req.path} - ${duration}ms`);
      }
      
      // Log performance metrics for monitoring
      logger.info(`Request completed: ${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);
      
      // Clean up metrics
      requestMetrics.delete(requestId);
      
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  } catch (error) {
    logger.error('Error in performance monitoring middleware:', error);
    next();
  }
};

/**
 * Database connection optimization middleware
 */
export const databaseOptimization = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Add database optimization headers
    res.set('X-Database-Optimization', 'enabled');
    
    // Add query hints for common operations
    if (req.path.includes('/predictions') && req.method === 'GET') {
      res.set('X-Query-Hint', 'use-index:userId_1_predictionDate_-1');
    }
    
    if (req.path.includes('/users') && req.method === 'GET') {
      res.set('X-Query-Hint', 'use-index:email_1');
    }
    
    next();
  } catch (error) {
    logger.error('Error in database optimization middleware:', error);
    next();
  }
};

/**
 * Memory usage monitoring middleware
 */
export const memoryMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    
    // Add memory headers
    res.set('X-Memory-Heap-Used', heapUsedMB.toString());
    res.set('X-Memory-Heap-Total', heapTotalMB.toString());
    
    // Log high memory usage
    if (heapUsedMB > 500) { // 500MB threshold
      logger.warn(`High memory usage detected: ${heapUsedMB}MB`);
    }
    
    next();
  } catch (error) {
    logger.error('Error in memory monitoring middleware:', error);
    next();
  }
};

/**
 * Generate cache key for API requests
 */
function generateCacheKey(req: Request): string {
  const queryString = Object.keys(req.query)
    .sort()
    .map(key => `${key}=${req.query[key]}`)
    .join('&');
  
  return `${req.method}:${req.path}:${queryString}`;
}

/**
 * Optimize response size by removing unnecessary data
 */
function optimizeResponseSize(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  // Remove null/undefined values
  const optimized = JSON.parse(JSON.stringify(body, (key, value) => {
    if (value === null || value === undefined) {
      return undefined;
    }
    return value;
  }));
  
  // Limit array sizes for large responses
  if (Array.isArray(optimized) && optimized.length > 100) {
    return optimized.slice(0, 100);
  }
  
  return optimized;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics[] {
  return Array.from(requestMetrics.values());
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics(): void {
  requestMetrics.clear();
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): any {
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
  
  const durations = completedMetrics.map(m => m.duration!);
  const averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
  
  return {
    totalRequests: completedMetrics.length,
    averageResponseTime: Math.round(averageResponseTime),
    slowestRequest: Math.max(...durations),
    fastestRequest: Math.min(...durations),
    requestsByStatus: completedMetrics.reduce((acc, m) => {
      acc[m.statusCode!] = (acc[m.statusCode!] || 0) + 1;
      return acc;
    }, {} as Record<number, number>),
  };
}
