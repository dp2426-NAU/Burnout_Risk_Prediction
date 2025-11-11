interface EnvConfig {
    PORT: number;
    NODE_ENV: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
}
export declare const config: EnvConfig;
export declare const PORT: number, NODE_ENV: string, MONGODB_URI: string, JWT_SECRET: string, JWT_EXPIRES_IN: string, CORS_ORIGIN: string, RATE_LIMIT_WINDOW_MS: number, RATE_LIMIT_MAX_REQUESTS: number;
export {};
//# sourceMappingURL=env.d.ts.map