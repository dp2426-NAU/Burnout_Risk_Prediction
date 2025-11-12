"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDatabaseConnected = exports.getConnectionStats = exports.checkDatabaseHealth = exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
function normalizeMongoDBURI(uri) {
    if (uri.includes('mongodb+srv://')) {
        const match = uri.match(/mongodb\+srv:\/\/[^@]+@([^\/\?]+)/);
        if (match) {
            const clusterHost = match[1];
            const clusterIndex = uri.indexOf(clusterHost) + clusterHost.length;
            const afterCluster = uri.substring(clusterIndex);
            if (afterCluster === '' || afterCluster === '/' || afterCluster.startsWith('/?')) {
                if (afterCluster.startsWith('/?')) {
                    uri = uri.replace(clusterHost + '/?', clusterHost + '/burnout-risk-prediction?');
                }
                else if (afterCluster === '/') {
                    uri = uri.replace(clusterHost + '/', clusterHost + '/burnout-risk-prediction');
                }
                else {
                    uri = uri.replace(clusterHost, clusterHost + '/burnout-risk-prediction');
                }
            }
            else if (afterCluster.startsWith('/') && !afterCluster.match(/^\/burnout-risk-prediction(\?|$)/)) {
                const pathMatch = afterCluster.match(/^(\/[^?]+)(\?.*)?$/);
                if (pathMatch && pathMatch[1] !== '/burnout-risk-prediction') {
                    uri = uri.replace(clusterHost + pathMatch[1], clusterHost + '/burnout-risk-prediction');
                }
            }
        }
    }
    return uri;
}
const normalizedMongoDBURI = normalizeMongoDBURI(env_1.MONGODB_URI);
const mongoOptions = {
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000'),
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000'),
    connectTimeoutMS: 10000,
    bufferCommands: false,
    retryWrites: true,
    retryReads: true,
    readPreference: 'secondaryPreferred',
    heartbeatFrequencyMS: 10000,
};
const RETRY_CONFIG = {
    maxRetries: 5,
    retryDelay: 1000,
    backoffMultiplier: 2
};
let isConnected = false;
let connectionRetries = 0;
const connectDatabase = async () => {
    if (isConnected) {
        logger_1.logger.info('Database already connected');
        return;
    }
    const attemptConnection = async (retryCount = 0) => {
        try {
            logger_1.logger.info(`Attempting to connect to MongoDB (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
            logger_1.logger.info(`Connecting to database: ${normalizedMongoDBURI.replace(/\/\/.*@/, '//***:***@')}`);
            await mongoose_1.default.connect(normalizedMongoDBURI, mongoOptions);
            isConnected = true;
            connectionRetries = 0;
            logger_1.logger.info('✅ Connected to MongoDB successfully');
            logger_1.logger.info(`Database name: ${mongoose_1.default.connection.db?.databaseName}`);
            setupConnectionListeners();
        }
        catch (error) {
            connectionRetries++;
            logger_1.logger.error(`MongoDB connection attempt ${retryCount + 1} failed:`, error);
            if (retryCount < RETRY_CONFIG.maxRetries - 1) {
                const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
                logger_1.logger.info(`Retrying connection in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return attemptConnection(retryCount + 1);
            }
            else {
                logger_1.logger.error('❌ Failed to connect to MongoDB after all retry attempts');
                if (env_1.NODE_ENV === 'production') {
                    process.exit(1);
                }
            }
        }
    };
    await attemptConnection();
};
exports.connectDatabase = connectDatabase;
const setupConnectionListeners = () => {
    mongoose_1.default.connection.on('connected', () => {
        logger_1.logger.info('MongoDB connection established');
        isConnected = true;
    });
    mongoose_1.default.connection.on('error', (error) => {
        logger_1.logger.error('MongoDB connection error:', error);
        isConnected = false;
    });
    mongoose_1.default.connection.on('disconnected', () => {
        logger_1.logger.warn('MongoDB disconnected');
        isConnected = false;
    });
    mongoose_1.default.connection.on('reconnected', () => {
        logger_1.logger.info('MongoDB reconnected');
        isConnected = true;
    });
    process.on('SIGINT', async () => {
        await (0, exports.disconnectDatabase)();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await (0, exports.disconnectDatabase)();
        process.exit(0);
    });
};
const disconnectDatabase = async () => {
    if (!isConnected) {
        return;
    }
    try {
        await mongoose_1.default.connection.close();
        isConnected = false;
        logger_1.logger.info('MongoDB connection closed gracefully');
    }
    catch (error) {
        logger_1.logger.error('Error closing MongoDB connection:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
const checkDatabaseHealth = async () => {
    try {
        if (!isConnected) {
            return false;
        }
        await mongoose_1.default.connection.db.admin().ping();
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
const getConnectionStats = () => {
    const connection = mongoose_1.default.connection;
    return {
        readyState: connection.readyState,
        host: connection.host,
        port: connection.port,
        name: connection.name,
        isConnected: isConnected,
        retryCount: connectionRetries
    };
};
exports.getConnectionStats = getConnectionStats;
const isDatabaseConnected = () => isConnected;
exports.isDatabaseConnected = isDatabaseConnected;
exports.default = mongoose_1.default;
//# sourceMappingURL=database.js.map