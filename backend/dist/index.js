"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const auth_routes_1 = __importDefault(require("./api/routes/auth.routes"));
const prediction_routes_1 = __importDefault(require("./api/routes/prediction.routes"));
const metadata_routes_1 = __importDefault(require("./api/routes/metadata.routes"));
const users_routes_1 = __importDefault(require("./api/routes/users.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
const allowedOrigins = env_1.config.CORS_ORIGIN.split(',').map(origin => origin.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.RATE_LIMIT_WINDOW_MS,
    max: env_1.config.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', { stream: logger_1.morganStream }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
    logger_1.logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/predictions', prediction_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api', metadata_routes_1.default);
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Burnout Risk Prediction API',
        version: '1.0.0',
        author: 'Balaji Koneti',
        documentation: '/api/info',
        health: '/api/health'
    });
});
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'burnout-risk-prediction-api',
        version: '1.0.0'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
    });
});
app.use((error, req, res, next) => {
    logger_1.logger.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(env_1.config.NODE_ENV === 'development' && { error: error.message })
    });
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
        const server = app.listen(env_1.config.PORT, () => {
            logger_1.logger.info(`Server running on port ${env_1.config.PORT}`);
            logger_1.logger.info(`Environment: ${env_1.config.NODE_ENV}`);
            logger_1.logger.info(`API Documentation: http://localhost:${env_1.config.PORT}/api/info`);
            logger_1.logger.info(`Health Check: http://localhost:${env_1.config.PORT}/api/health`);
        });
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger_1.logger.error(`Port ${env_1.config.PORT} is already in use`);
                process.exit(1);
            }
            else {
                logger_1.logger.error('Server error:', error);
                process.exit(1);
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map