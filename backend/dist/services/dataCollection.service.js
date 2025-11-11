"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataCollectionService = void 0;
const logger_1 = require("../utils/logger");
const axios_1 = __importDefault(require("axios"));
class DataCollectionService {
    constructor() {
        this.isInitialized = false;
        this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Data Collection Service...');
            await this.testMLServiceConnection();
            this.isInitialized = true;
            logger_1.logger.info('Data Collection Service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Data Collection Service:', error);
            throw error;
        }
    }
    async testMLServiceConnection() {
        try {
            const response = await axios_1.default.get(`${this.mlServiceUrl}/health`, {
                timeout: 5000
            });
            if (response.status !== 200) {
                throw new Error(`ML service health check failed: ${response.status}`);
            }
            logger_1.logger.info('ML service connection verified');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to ML service:', error);
            throw new Error(`Cannot connect to ML service at ${this.mlServiceUrl}`);
        }
    }
    async collectUserData(request) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            logger_1.logger.info(`Starting data collection for user ${request.userId} from ${request.startDate} to ${request.endDate}`);
            const mlRequest = {
                user_id: request.userId,
                start_date: request.startDate.toISOString(),
                end_date: request.endDate.toISOString(),
                data_types: request.dataTypes,
                validate_data: request.validateData ?? true
            };
            const response = await axios_1.default.post(`${this.mlServiceUrl}/data-pipeline/collect-user-data`, mlRequest, {
                timeout: 300000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) {
                throw new Error(`ML service returned status ${response.status}`);
            }
            const mlResponse = response.data;
            const result = {
                success: mlResponse.success,
                collectionId: mlResponse.collection_id,
                message: mlResponse.message,
                results: {},
                errors: mlResponse.errors || []
            };
            if (mlResponse.stored_versions) {
                if (mlResponse.stored_versions.calendar) {
                    result.results.calendar = {
                        eventsCollected: mlResponse.steps?.data_collection?.records_collected?.calendar_events || 0,
                        versionId: mlResponse.stored_versions.calendar
                    };
                }
                if (mlResponse.stored_versions.email) {
                    result.results.email = {
                        messagesCollected: mlResponse.steps?.data_collection?.records_collected?.email_messages || 0,
                        versionId: mlResponse.stored_versions.email
                    };
                }
            }
            logger_1.logger.info(`Data collection completed for user ${request.userId}: ${result.success ? 'success' : 'failed'}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error collecting data for user ${request.userId}:`, error);
            return {
                success: false,
                message: `Data collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async collectBatchData(userIds, startDate, endDate, dataTypes = ['calendar', 'email'], validateData = true) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            logger_1.logger.info(`Starting batch data collection for ${userIds.length} users from ${startDate} to ${endDate}`);
            const mlRequest = {
                user_ids: userIds,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                data_types: dataTypes,
                validate_data: validateData,
                max_concurrent: 5
            };
            const response = await axios_1.default.post(`${this.mlServiceUrl}/data-pipeline/collect-batch-data`, mlRequest, {
                timeout: 600000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) {
                throw new Error(`ML service returned status ${response.status}`);
            }
            const mlResponse = response.data;
            const result = {
                success: mlResponse.summary?.successful > 0,
                batchId: mlResponse.batch_id,
                userResults: {},
                summary: {
                    successful: mlResponse.summary?.successful || 0,
                    failed: mlResponse.summary?.failed || 0,
                    totalDurationSeconds: mlResponse.summary?.total_duration_seconds || 0
                },
                errors: mlResponse.batch_error ? [mlResponse.batch_error] : []
            };
            if (mlResponse.user_results) {
                for (const [userId, userResult] of Object.entries(mlResponse.user_results)) {
                    result.userResults[userId] = {
                        success: userResult.success,
                        collectionId: userResult.collection_id,
                        message: userResult.message,
                        results: userResult.results,
                        errors: userResult.errors
                    };
                }
            }
            logger_1.logger.info(`Batch data collection completed: ${result.summary.successful}/${userIds.length} successful`);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error in batch data collection:', error);
            return {
                success: false,
                userResults: {},
                summary: {
                    successful: 0,
                    failed: userIds.length,
                    totalDurationSeconds: 0
                },
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async runScheduledCollection(daysBack = 7, userIds) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            logger_1.logger.info(`Running scheduled data collection for last ${daysBack} days`);
            const mlRequest = {
                days_back: daysBack,
                user_ids: userIds || null
            };
            const response = await axios_1.default.post(`${this.mlServiceUrl}/data-pipeline/scheduled-collection`, mlRequest, {
                timeout: 900000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) {
                throw new Error(`ML service returned status ${response.status}`);
            }
            const mlResponse = response.data;
            const result = {
                success: mlResponse.success,
                scheduledRunId: mlResponse.scheduled_run_id,
                results: mlResponse,
                errors: mlResponse.error ? [mlResponse.error] : []
            };
            logger_1.logger.info(`Scheduled data collection completed: ${result.success ? 'success' : 'failed'}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error in scheduled data collection:', error);
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async getPipelineStatus() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            const response = await axios_1.default.get(`${this.mlServiceUrl}/data-pipeline/status`, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) {
                throw new Error(`ML service returned status ${response.status}`);
            }
            const mlResponse = response.data;
            const status = {
                status: mlResponse.pipeline_status,
                storageStatistics: {
                    totalVersions: mlResponse.storage_statistics?.total_versions || 0,
                    totalSizeMB: mlResponse.storage_statistics?.total_size_mb || 0,
                    totalRecords: mlResponse.storage_statistics?.total_records || 0,
                    versionsByType: mlResponse.storage_statistics?.versions_by_type || {}
                },
                recentActivity: {
                    last24hVersions: mlResponse.recent_activity?.last_24h_versions || 0,
                    last24hSizeMB: mlResponse.recent_activity?.last_24h_size_mb || 0,
                    last24hRecords: mlResponse.recent_activity?.last_24h_records || 0
                },
                latestVersions: mlResponse.latest_versions || []
            };
            return status;
        }
        catch (error) {
            logger_1.logger.error('Error getting pipeline status:', error);
            return {
                status: 'error',
                storageStatistics: {
                    totalVersions: 0,
                    totalSizeMB: 0,
                    totalRecords: 0,
                    versionsByType: {}
                },
                recentActivity: {
                    last24hVersions: 0,
                    last24hSizeMB: 0,
                    last24hRecords: 0
                },
                latestVersions: []
            };
        }
    }
    async cleanupOldData(keepDays = 30) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            logger_1.logger.info(`Cleaning up data older than ${keepDays} days`);
            const response = await axios_1.default.post(`${this.mlServiceUrl}/data-pipeline/cleanup`, { keep_days: keepDays }, {
                timeout: 300000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) {
                throw new Error(`ML service returned status ${response.status}`);
            }
            const mlResponse = response.data;
            const result = {
                success: mlResponse.success,
                message: mlResponse.message,
                errors: mlResponse.errors || []
            };
            logger_1.logger.info(`Data cleanup completed: ${result.success ? 'success' : 'failed'}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error during data cleanup:', error);
            return {
                success: false,
                message: `Data cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async getDataLineage(versionId) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            const response = await axios_1.default.get(`${this.mlServiceUrl}/data-pipeline/lineage/${versionId}`, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) {
                throw new Error(`ML service returned status ${response.status}`);
            }
            const mlResponse = response.data;
            return {
                success: true,
                lineage: mlResponse
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting data lineage for version ${versionId}:`, error);
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
}
exports.dataCollectionService = new DataCollectionService();
//# sourceMappingURL=dataCollection.service.js.map