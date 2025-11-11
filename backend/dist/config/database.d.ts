import mongoose from 'mongoose';
export declare const connectDatabase: () => Promise<void>;
export declare const disconnectDatabase: () => Promise<void>;
export declare const checkDatabaseHealth: () => Promise<boolean>;
export declare const getConnectionStats: () => {
    readyState: mongoose.ConnectionStates;
    host: string;
    port: number;
    name: string;
    isConnected: boolean;
    retryCount: number;
};
export declare const isDatabaseConnected: () => boolean;
export default mongoose;
//# sourceMappingURL=database.d.ts.map