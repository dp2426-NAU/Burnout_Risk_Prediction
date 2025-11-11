"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const CACHE_TTL = {
    SESSION: 7 * 24 * 60 * 60,
    USER_PROFILE: 24 * 60 * 60,
    PREDICTION: 60 * 60,
    DASHBOARD_DATA: 30 * 60,
    API_RESPONSE: 15 * 60,
    TOKEN_BLACKLIST: 24 * 60 * 60,
};
const CACHE_PREFIXES = {
    SESSION: 'session:',
    USER: 'user:',
    PREDICTION: 'prediction:',
    DASHBOARD: 'dashboard:',
    API: 'api:',
    TOKEN: 'token:',
};
class CacheService {
    constructor() {
        this.isConnected = false;
        const config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        };
        this.redis = new ioredis_1.default(config);
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.redis.on('connect', () => {
            this.isConnected = true;
            logger_1.logger.info('✅ Redis connected successfully');
        });
        this.redis.on('error', (error) => {
            this.isConnected = false;
            logger_1.logger.error('❌ Redis connection error:', error);
        });
        this.redis.on('close', () => {
            this.isConnected = false;
            logger_1.logger.warn('⚠️ Redis connection closed');
        });
        this.redis.on('reconnecting', () => {
            logger_1.logger.info('🔄 Redis reconnecting...');
        });
    }
    isRedisConnected() {
        return this.isConnected;
    }
    async get(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping cache get');
                return null;
            }
            const value = await this.redis.get(key);
            if (value === null) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error(`Error getting cache key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping cache set');
                return false;
            }
            const serializedValue = JSON.stringify(value);
            if (ttlSeconds) {
                await this.redis.setex(key, ttlSeconds, serializedValue);
            }
            else {
                await this.redis.set(key, serializedValue);
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error setting cache key ${key}:`, error);
            return false;
        }
    }
    async del(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping cache delete');
                return false;
            }
            const result = await this.redis.del(key);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting cache key ${key}:`, error);
            return false;
        }
    }
    async exists(key) {
        try {
            if (!this.isConnected) {
                return false;
            }
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`Error checking cache key existence ${key}:`, error);
            return false;
        }
    }
    async expire(key, ttlSeconds) {
        try {
            if (!this.isConnected) {
                return false;
            }
            const result = await this.redis.expire(key, ttlSeconds);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`Error setting expiration for key ${key}:`, error);
            return false;
        }
    }
    async ttl(key) {
        try {
            if (!this.isConnected) {
                return -1;
            }
            return await this.redis.ttl(key);
        }
        catch (error) {
            logger_1.logger.error(`Error getting TTL for key ${key}:`, error);
            return -1;
        }
    }
    async setSession(sessionId, sessionData) {
        const key = `${CACHE_PREFIXES.SESSION}${sessionId}`;
        return this.set(key, sessionData, CACHE_TTL.SESSION);
    }
    async getSession(sessionId) {
        const key = `${CACHE_PREFIXES.SESSION}${sessionId}`;
        return this.get(key);
    }
    async deleteSession(sessionId) {
        const key = `${CACHE_PREFIXES.SESSION}${sessionId}`;
        return this.del(key);
    }
    async setUserProfile(userId, profileData) {
        const key = `${CACHE_PREFIXES.USER}profile:${userId}`;
        return this.set(key, profileData, CACHE_TTL.USER_PROFILE);
    }
    async getUserProfile(userId) {
        const key = `${CACHE_PREFIXES.USER}profile:${userId}`;
        return this.get(key);
    }
    async deleteUserProfile(userId) {
        const key = `${CACHE_PREFIXES.USER}profile:${userId}`;
        return this.del(key);
    }
    async setPrediction(predictionId, predictionData) {
        const key = `${CACHE_PREFIXES.PREDICTION}${predictionId}`;
        return this.set(key, predictionData, CACHE_TTL.PREDICTION);
    }
    async getPrediction(predictionId) {
        const key = `${CACHE_PREFIXES.PREDICTION}${predictionId}`;
        return this.get(key);
    }
    async setUserPredictions(userId, predictions) {
        const key = `${CACHE_PREFIXES.PREDICTION}user:${userId}`;
        return this.set(key, predictions, CACHE_TTL.PREDICTION);
    }
    async getUserPredictions(userId) {
        const key = `${CACHE_PREFIXES.PREDICTION}user:${userId}`;
        return this.get(key) || [];
    }
    async setDashboardData(userId, dashboardData) {
        const key = `${CACHE_PREFIXES.DASHBOARD}${userId}`;
        return this.set(key, dashboardData, CACHE_TTL.DASHBOARD_DATA);
    }
    async getDashboardData(userId) {
        const key = `${CACHE_PREFIXES.DASHBOARD}${userId}`;
        return this.get(key);
    }
    async deleteDashboardData(userId) {
        const key = `${CACHE_PREFIXES.DASHBOARD}${userId}`;
        return this.del(key);
    }
    async setApiResponse(endpoint, params, response) {
        const cacheKey = this.generateApiCacheKey(endpoint, params);
        const key = `${CACHE_PREFIXES.API}${cacheKey}`;
        return this.set(key, response, CACHE_TTL.API_RESPONSE);
    }
    async getApiResponse(endpoint, params) {
        const cacheKey = this.generateApiCacheKey(endpoint, params);
        const key = `${CACHE_PREFIXES.API}${cacheKey}`;
        return this.get(key);
    }
    generateApiCacheKey(endpoint, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        return `${endpoint}:${sortedParams}`;
    }
    async blacklistToken(token) {
        const key = `${CACHE_PREFIXES.TOKEN}blacklist:${token}`;
        return this.set(key, true, CACHE_TTL.TOKEN_BLACKLIST);
    }
    async isTokenBlacklisted(token) {
        const key = `${CACHE_PREFIXES.TOKEN}blacklist:${token}`;
        return this.exists(key);
    }
    async getCacheStats() {
        try {
            if (!this.isConnected) {
                return null;
            }
            const info = await this.redis.info('memory');
            const keyspace = await this.redis.info('keyspace');
            return {
                connected: this.isConnected,
                memory: info,
                keyspace: keyspace,
                uptime: await this.redis.uptime(),
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting cache stats:', error);
            return null;
        }
    }
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return false;
            }
            const pong = await this.redis.ping();
            return pong === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Redis health check failed:', error);
            return false;
        }
    }
    async clearAll() {
        try {
            if (!this.isConnected) {
                return false;
            }
            await this.redis.flushdb();
            logger_1.logger.info('All cache cleared');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error clearing cache:', error);
            return false;
        }
    }
    async clearByPattern(pattern) {
        try {
            if (!this.isConnected) {
                return 0;
            }
            const keys = await this.redis.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            const result = await this.redis.del(...keys);
            logger_1.logger.info(`Cleared ${result} keys matching pattern: ${pattern}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error clearing cache by pattern ${pattern}:`, error);
            return 0;
        }
    }
    async close() {
        try {
            await this.redis.quit();
            this.isConnected = false;
            logger_1.logger.info('Redis connection closed');
        }
        catch (error) {
            logger_1.logger.error('Error closing Redis connection:', error);
        }
    }
}
exports.cacheService = new CacheService();
exports.default = exports.cacheService;
//# sourceMappingURL=cache.service.js.map