// Data Collection Service - Created by Harish S & Team
// Service for coordinating data collection from external APIs and ML pipeline

import { logger } from '../utils/logger';
import axios from 'axios';

// Interface for data collection request
export interface DataCollectionRequest {
  userId: string;
  startDate: Date;
  endDate: Date;
  dataTypes: ('calendar' | 'email' | 'profile')[];
  validateData?: boolean;
}

// Interface for data collection response
export interface DataCollectionResponse {
  success: boolean;
  collectionId?: string;
  message?: string;
  results?: {
    calendar?: {
      eventsCollected: number;
      versionId: string;
    };
    email?: {
      messagesCollected: number;
      versionId: string;
    };
    profile?: {
      profileUpdated: boolean;
      versionId: string;
    };
  };
  errors?: string[];
}

// Interface for pipeline status
export interface PipelineStatus {
  status: 'operational' | 'not_initialized' | 'error';
  storageStatistics: {
    totalVersions: number;
    totalSizeMB: number;
    totalRecords: number;
    versionsByType: Record<string, number>;
  };
  recentActivity: {
    last24hVersions: number;
    last24hSizeMB: number;
    last24hRecords: number;
  };
  latestVersions: Array<{
    versionId: string;
    dataType: string;
    createdAt: string;
    recordCount: number;
    fileSizeMB: number;
  }>;
}

class DataCollectionService {
  private mlServiceUrl: string;
  private isInitialized: boolean = false;

  constructor() {
    // Get ML service URL from environment or use default
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Initialize the data collection service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Data Collection Service...');
      
      // Test connection to ML service
      await this.testMLServiceConnection();
      
      this.isInitialized = true;
      logger.info('Data Collection Service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Data Collection Service:', error);
      throw error;
    }
  }

  /**
   * Test connection to ML service
   */
  private async testMLServiceConnection(): Promise<void> {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/health`, {
        timeout: 5000
      });
      
      if (response.status !== 200) {
        throw new Error(`ML service health check failed: ${response.status}`);
      }
      
      logger.info('ML service connection verified');
      
    } catch (error) {
      logger.error('Failed to connect to ML service:', error);
      throw new Error(`Cannot connect to ML service at ${this.mlServiceUrl}`);
    }
  }

  /**
   * Collect data for a single user
   */
  async collectUserData(request: DataCollectionRequest): Promise<DataCollectionResponse> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info(`Starting data collection for user ${request.userId} from ${request.startDate} to ${request.endDate}`);

      // Prepare request for ML service
      const mlRequest = {
        user_id: request.userId,
        start_date: request.startDate.toISOString(),
        end_date: request.endDate.toISOString(),
        data_types: request.dataTypes,
        validate_data: request.validateData ?? true
      };

      // Call ML service data pipeline
      const response = await axios.post(
        `${this.mlServiceUrl}/data-pipeline/collect-user-data`,
        mlRequest,
        {
          timeout: 300000, // 5 minutes timeout for data collection
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`ML service returned status ${response.status}`);
      }

      const mlResponse = response.data;

      // Transform ML service response to our format
      const result: DataCollectionResponse = {
        success: mlResponse.success,
        collectionId: mlResponse.collection_id,
        message: mlResponse.message,
        results: {},
        errors: mlResponse.errors || []
      };

      // Extract results for each data type
      if (mlResponse.stored_versions) {
        if (mlResponse.stored_versions.calendar) {
          result.results!.calendar = {
            eventsCollected: mlResponse.steps?.data_collection?.records_collected?.calendar_events || 0,
            versionId: mlResponse.stored_versions.calendar
          };
        }

        if (mlResponse.stored_versions.email) {
          result.results!.email = {
            messagesCollected: mlResponse.steps?.data_collection?.records_collected?.email_messages || 0,
            versionId: mlResponse.stored_versions.email
          };
        }
      }

      logger.info(`Data collection completed for user ${request.userId}: ${result.success ? 'success' : 'failed'}`);
      
      return result;

    } catch (error) {
      logger.error(`Error collecting data for user ${request.userId}:`, error);
      
      return {
        success: false,
        message: `Data collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Collect data for multiple users in batch
   */
  async collectBatchData(
    userIds: string[],
    startDate: Date,
    endDate: Date,
    dataTypes: ('calendar' | 'email' | 'profile')[] = ['calendar', 'email'],
    validateData: boolean = true
  ): Promise<{
    success: boolean;
    batchId?: string;
    userResults: Record<string, DataCollectionResponse>;
    summary: {
      successful: number;
      failed: number;
      totalDurationSeconds: number;
    };
    errors?: string[];
  }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info(`Starting batch data collection for ${userIds.length} users from ${startDate} to ${endDate}`);

      // Prepare request for ML service
      const mlRequest = {
        user_ids: userIds,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        data_types: dataTypes,
        validate_data: validateData,
        max_concurrent: 5
      };

      // Call ML service batch pipeline
      const response = await axios.post(
        `${this.mlServiceUrl}/data-pipeline/collect-batch-data`,
        mlRequest,
        {
          timeout: 600000, // 10 minutes timeout for batch collection
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`ML service returned status ${response.status}`);
      }

      const mlResponse = response.data;

      // Transform ML service response
      const result = {
        success: mlResponse.summary?.successful > 0,
        batchId: mlResponse.batch_id,
        userResults: {} as Record<string, DataCollectionResponse>,
        summary: {
          successful: mlResponse.summary?.successful || 0,
          failed: mlResponse.summary?.failed || 0,
          totalDurationSeconds: mlResponse.summary?.total_duration_seconds || 0
        },
        errors: mlResponse.batch_error ? [mlResponse.batch_error] : []
      };

      // Transform user results
      if (mlResponse.user_results) {
        for (const [userId, userResult] of Object.entries(mlResponse.user_results)) {
          result.userResults[userId] = {
            success: (userResult as any).success,
            collectionId: (userResult as any).collection_id,
            message: (userResult as any).message,
            results: (userResult as any).results,
            errors: (userResult as any).errors
          };
        }
      }

      logger.info(`Batch data collection completed: ${result.summary.successful}/${userIds.length} successful`);
      
      return result;

    } catch (error) {
      logger.error('Error in batch data collection:', error);
      
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

  /**
   * Run scheduled data collection for recent data
   */
  async runScheduledCollection(
    daysBack: number = 7,
    userIds?: string[]
  ): Promise<{
    success: boolean;
    scheduledRunId?: string;
    results?: any;
    errors?: string[];
  }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info(`Running scheduled data collection for last ${daysBack} days`);

      // Prepare request for ML service
      const mlRequest = {
        days_back: daysBack,
        user_ids: userIds || null
      };

      // Call ML service scheduled pipeline
      const response = await axios.post(
        `${this.mlServiceUrl}/data-pipeline/scheduled-collection`,
        mlRequest,
        {
          timeout: 900000, // 15 minutes timeout for scheduled collection
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

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

      logger.info(`Scheduled data collection completed: ${result.success ? 'success' : 'failed'}`);
      
      return result;

    } catch (error) {
      logger.error('Error in scheduled data collection:', error);
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get pipeline status and statistics
   */
  async getPipelineStatus(): Promise<PipelineStatus> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Call ML service status endpoint
      const response = await axios.get(
        `${this.mlServiceUrl}/data-pipeline/status`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`ML service returned status ${response.status}`);
      }

      const mlResponse = response.data;

      // Transform ML service response to our format
      const status: PipelineStatus = {
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

    } catch (error) {
      logger.error('Error getting pipeline status:', error);
      
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

  /**
   * Clean up old data to save storage space
   */
  async cleanupOldData(keepDays: number = 30): Promise<{
    success: boolean;
    message?: string;
    errors?: string[];
  }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info(`Cleaning up data older than ${keepDays} days`);

      // Call ML service cleanup endpoint
      const response = await axios.post(
        `${this.mlServiceUrl}/data-pipeline/cleanup`,
        { keep_days: keepDays },
        {
          timeout: 300000, // 5 minutes timeout for cleanup
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`ML service returned status ${response.status}`);
      }

      const mlResponse = response.data;

      const result = {
        success: mlResponse.success,
        message: mlResponse.message,
        errors: mlResponse.errors || []
      };

      logger.info(`Data cleanup completed: ${result.success ? 'success' : 'failed'}`);
      
      return result;

    } catch (error) {
      logger.error('Error during data cleanup:', error);
      
      return {
        success: false,
        message: `Data cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get data lineage for a specific version
   */
  async getDataLineage(versionId: string): Promise<{
    success: boolean;
    lineage?: any;
    errors?: string[];
  }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Call ML service lineage endpoint
      const response = await axios.get(
        `${this.mlServiceUrl}/data-pipeline/lineage/${versionId}`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`ML service returned status ${response.status}`);
      }

      const mlResponse = response.data;

      return {
        success: true,
        lineage: mlResponse
      };

    } catch (error) {
      logger.error(`Error getting data lineage for version ${versionId}:`, error);
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

// Export singleton instance
export const dataCollectionService = new DataCollectionService();

