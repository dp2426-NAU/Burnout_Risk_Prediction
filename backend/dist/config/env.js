"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_MAX_REQUESTS = exports.RATE_LIMIT_WINDOW_MS = exports.CORS_ORIGIN = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = exports.MONGODB_URI = exports.NODE_ENV = exports.PORT = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET'
];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
exports.config = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
};
exports.PORT = exports.config.PORT, exports.NODE_ENV = exports.config.NODE_ENV, exports.MONGODB_URI = exports.config.MONGODB_URI, exports.JWT_SECRET = exports.config.JWT_SECRET, exports.JWT_EXPIRES_IN = exports.config.JWT_EXPIRES_IN, exports.CORS_ORIGIN = exports.config.CORS_ORIGIN, exports.RATE_LIMIT_WINDOW_MS = exports.config.RATE_LIMIT_WINDOW_MS, exports.RATE_LIMIT_MAX_REQUESTS = exports.config.RATE_LIMIT_MAX_REQUESTS;
//# sourceMappingURL=env.js.map