// Enhanced database configuration with connection pooling and retry logic - Created by Balaji Koneti
import mongoose, { ConnectOptions } from 'mongoose';
import { MONGODB_URI, NODE_ENV } from './env';
import { logger } from '../utils/logger';

// Enhanced MongoDB connection options
const mongoOptions: ConnectOptions = {
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

// Connection retry configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  retryDelay: 1000,
  backoffMultiplier: 2
};

// Connection state tracking
let isConnected = false;
let connectionRetries = 0;

// Enhanced connection function with retry logic
export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  const attemptConnection = async (retryCount: number = 0): Promise<void> => {
    try {
      logger.info(`Attempting to connect to MongoDB (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
      
      await mongoose.connect(MONGODB_URI, mongoOptions);
      
      isConnected = true;
      connectionRetries = 0;
      
      logger.info('✅ Connected to MongoDB successfully');
      logger.info(`Database name: ${mongoose.connection.db?.databaseName}`);
      
      // Set up connection event listeners
      setupConnectionListeners();
      
    } catch (error) {
      connectionRetries++;
      logger.error(`MongoDB connection attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < RETRY_CONFIG.maxRetries - 1) {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
        logger.info(`Retrying connection in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptConnection(retryCount + 1);
      } else {
        logger.error('❌ Failed to connect to MongoDB after all retry attempts');
        if (NODE_ENV === 'production') {
          process.exit(1);
        }
      }
    }
  };

  await attemptConnection();
};

// Setup connection event listeners
const setupConnectionListeners = (): void => {
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
    isConnected = true;
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
    isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
    isConnected = true;
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

// Graceful disconnect function
export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (!isConnected) {
      return false;
    }

    // Ping the database
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Get connection statistics
export const getConnectionStats = () => {
  const connection = mongoose.connection;
  return {
    readyState: connection.readyState,
    host: connection.host,
    port: connection.port,
    name: connection.name,
    isConnected: isConnected,
    retryCount: connectionRetries
  };
};

// Connection state getter
export const isDatabaseConnected = (): boolean => isConnected;

// Export mongoose instance for use in other modules
export default mongoose;
