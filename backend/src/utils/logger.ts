// Winston logger configuration - Created by Harish S & Team
import winston from 'winston';
import { NODE_ENV } from '../config/env';

// Define log levels with custom colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for different log levels
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Define log format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define log format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array based on environment
const transports: winston.transport[] = [
  // Console transport for all environments
  new winston.transports.Console({
    level: NODE_ENV === 'production' ? 'warn' : 'debug',
    format: consoleFormat,
  }),
];

// Add file transports for production environment
if (NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
    })
  );
  
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
    })
  );
}

// Create and configure the logger instance
export const logger = winston.createLogger({
  level: NODE_ENV === 'development' ? 'debug' : 'warn',
  levels: logLevels,
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ],
});

// Create a stream for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
