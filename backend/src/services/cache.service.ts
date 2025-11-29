// Redis Cache Service - Created by Harish S & Team
import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Cache configuration interface
interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
}

// Cache TTL configuration
const CACHE_TTL = {
  SESSION: 7 * 24 * 60 * 60, // 7 days
  USER_PROFILE: 24 * 60 * 60, // 24 hours
  PREDICTION: 60 * 60, // 1 hour
  DASHBOARD_DATA: 30 * 60, // 30 minutes
  API_RESPONSE: 15 * 60, // 15 minutes
  TOKEN_BLACKLIST: 24 * 60 * 60, // 24 hours
} as const;

// Cache key prefixes
const CACHE_PREFIXES = {
  SESSION: 'session:',
  USER: 'user:',
  PREDICTION: 'prediction:',
  DASHBOARD: 'dashboard:',
  API: 'api:',
  TOKEN: 'token:',
} as const;

class CacheService {
  private redis: Redis;
  private isConnected: boolean = false;

  constructor() {
    const config: CacheConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };

    this.redis = new Redis(config);

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.redis.on('connect', () => {
      this.isConnected = true;
      logger.info('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
      logger.error('❌ Redis connection error:', error);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logger.warn('⚠️ Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache get');
        return null;
      }

      const value = await this.redis.get(key);
      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache set');
        return false;
      }

      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }

      return true;
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache delete');
        return false;
      }

      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking cache key existence ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.redis.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error(`Error setting expiration for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return -1;
      }

      return await this.redis.ttl(key);
    } catch (error) {
      logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  // Session Management
  async setSession(sessionId: string, sessionData: any): Promise<boolean> {
    const key = `${CACHE_PREFIXES.SESSION}${sessionId}`;
    return this.set(key, sessionData, CACHE_TTL.SESSION);
  }

  async getSession(sessionId: string): Promise<any> {
    const key = `${CACHE_PREFIXES.SESSION}${sessionId}`;
    return this.get(key);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `${CACHE_PREFIXES.SESSION}${sessionId}`;
    return this.del(key);
  }

  // User Profile Caching
  async setUserProfile(userId: string, profileData: any): Promise<boolean> {
    const key = `${CACHE_PREFIXES.USER}profile:${userId}`;
    return this.set(key, profileData, CACHE_TTL.USER_PROFILE);
  }

  async getUserProfile(userId: string): Promise<any> {
    const key = `${CACHE_PREFIXES.USER}profile:${userId}`;
    return this.get(key);
  }

  async deleteUserProfile(userId: string): Promise<boolean> {
    const key = `${CACHE_PREFIXES.USER}profile:${userId}`;
    return this.del(key);
  }

  // Prediction Caching
  async setPrediction(predictionId: string, predictionData: any): Promise<boolean> {
    const key = `${CACHE_PREFIXES.PREDICTION}${predictionId}`;
    return this.set(key, predictionData, CACHE_TTL.PREDICTION);
  }

  async getPrediction(predictionId: string): Promise<any> {
    const key = `${CACHE_PREFIXES.PREDICTION}${predictionId}`;
    return this.get(key);
  }

  async setUserPredictions(userId: string, predictions: any[]): Promise<boolean> {
    const key = `${CACHE_PREFIXES.PREDICTION}user:${userId}`;
    return this.set(key, predictions, CACHE_TTL.PREDICTION);
  }

  async getUserPredictions(userId: string): Promise<any[]> {
    const key = `${CACHE_PREFIXES.PREDICTION}user:${userId}`;
    const predictions = await this.get<any[]>(key);
    return predictions ?? [];
  }

  // Dashboard Data Caching
  async setDashboardData(userId: string, dashboardData: any): Promise<boolean> {
    const key = `${CACHE_PREFIXES.DASHBOARD}${userId}`;
    return this.set(key, dashboardData, CACHE_TTL.DASHBOARD_DATA);
  }

  async getDashboardData(userId: string): Promise<any> {
    const key = `${CACHE_PREFIXES.DASHBOARD}${userId}`;
    return this.get(key);
  }

  async deleteDashboardData(userId: string): Promise<boolean> {
    const key = `${CACHE_PREFIXES.DASHBOARD}${userId}`;
    return this.del(key);
  }

  // API Response Caching
  async setApiResponse(endpoint: string, params: any, response: any): Promise<boolean> {
    const cacheKey = this.generateApiCacheKey(endpoint, params);
    const key = `${CACHE_PREFIXES.API}${cacheKey}`;
    return this.set(key, response, CACHE_TTL.API_RESPONSE);
  }

  async getApiResponse(endpoint: string, params: any): Promise<any> {
    const cacheKey = this.generateApiCacheKey(endpoint, params);
    const key = `${CACHE_PREFIXES.API}${cacheKey}`;
    return this.get(key);
  }

  private generateApiCacheKey(endpoint: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}:${sortedParams}`;
  }

  // Token Blacklist
  async blacklistToken(token: string): Promise<boolean> {
    const key = `${CACHE_PREFIXES.TOKEN}blacklist:${token}`;
    return this.set(key, true, CACHE_TTL.TOKEN_BLACKLIST);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `${CACHE_PREFIXES.TOKEN}blacklist:${token}`;
    return this.exists(key);
  }

  // Cache Statistics
  async getCacheStats(): Promise<any> {
    try {
      if (!this.isConnected) {
        return null;
      }

      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      const serverInfo = await this.redis.info('server');
      const uptimeInSeconds = this.parseInfoValue(serverInfo, 'uptime_in_seconds');
      
      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace,
        uptimeSeconds: uptimeInSeconds !== null ? Number(uptimeInSeconds) : null,
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return null;
    }
  }
  
  private parseInfoValue(info: string, key: string): string | null {
    const line = info
      .split('\n')
      .map(entry => entry.trim())
      .find(entry => entry.startsWith(`${key}:`));

    if (!line) {
      return null;
    }

    const [, value] = line.split(':', 2);
    return value ?? null;
  }

  // Cache Health Check
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Clear all cache
  async clearAll(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.redis.flushdb();
      logger.info('All cache cleared');
      return true;
    } catch (error) {
      logger.error('Error clearing cache:', error);
      return false;
    }
  }

  // Clear cache by pattern
  async clearByPattern(pattern: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      logger.info(`Cleared ${result} keys matching pattern: ${pattern}`);
      return result;
    } catch (error) {
      logger.error(`Error clearing cache by pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Close Redis connection
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
