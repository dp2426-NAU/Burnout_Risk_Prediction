// Metadata controller for system information - Created by Harish S & Team
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// Get system health status
export const getHealthStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Get system uptime
    const uptime = process.uptime();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get Node.js version
    const nodeVersion = process.version;
    
    // Get environment
    const environment = process.env.NODE_ENV || 'development';
    
    // Return health status
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp,
        uptime: {
          seconds: Math.floor(uptime),
          human: formatUptime(uptime)
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024) // MB
        },
        system: {
          nodeVersion,
          environment,
          platform: process.platform,
          arch: process.arch
        }
      }
    });
    
  } catch (error) {
    // Log error and return error response
    logger.error('Error in getHealthStatus controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get API information
export const getApiInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    // Return API information
    res.status(200).json({
      success: true,
      data: {
        name: 'Burnout Risk Prediction API',
        version: '1.0.0',
        description: 'API for predicting burnout risk in hybrid and remote teams',
        author: 'Harish S & Team',
        endpoints: {
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            profile: 'GET /api/auth/profile',
            updateProfile: 'PUT /api/auth/profile',
            changePassword: 'PUT /api/auth/password',
            deactivate: 'DELETE /api/auth/account'
          },
          predictions: {
            generate: 'POST /api/predictions',
            latest: 'GET /api/predictions/latest',
            history: 'GET /api/predictions/history',
            byId: 'GET /api/predictions/:id',
            stats: 'GET /api/predictions/stats'
          },
          metadata: {
            health: 'GET /api/health',
            info: 'GET /api/info'
          }
        },
        features: [
          'User authentication and authorization',
          'Burnout risk prediction using ML models',
          'Feature extraction from calendar and email data',
          'Personalized recommendations',
          'Risk trend analysis',
          'Real-time health monitoring'
        ]
      }
    });
    
  } catch (error) {
    // Log error and return error response
    logger.error('Error in getApiInfo controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get model information
export const getModelInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    // Return model information
    res.status(200).json({
      success: true,
      data: {
        models: {
          burnoutRisk: {
            name: 'Burnout Risk Prediction Model',
            version: '1.0.0',
            type: 'Linear Regression',
            description: 'Predicts burnout risk based on work patterns, stress indicators, and lifestyle factors',
            features: [
              'Work hours and overtime',
              'Meeting frequency and duration',
              'Email patterns and sentiment',
              'Stress and workload levels',
              'Work-life balance indicators',
              'Health and lifestyle factors'
            ],
            output: {
              riskScore: '0-100 scale',
              riskLevel: 'low, medium, high, critical',
              confidence: '0-1 scale',
              recommendations: 'Personalized action items'
            },
            accuracy: '85%',
            lastTrained: '2024-01-01T00:00:00Z'
          }
        },
        featureExtraction: {
          calendarEvents: {
            description: 'Extracts features from calendar events including work hours, meetings, and breaks',
            features: [
              'workHours',
              'overtimeHours',
              'weekendWork',
              'meetingCount',
              'meetingDuration',
              'backToBackMeetings',
              'focusTimeRatio',
              'breakTimeRatio'
            ]
          },
          emailMessages: {
            description: 'Analyzes email patterns and sentiment for stress indicators',
            features: [
              'emailCount',
              'avgEmailLength',
              'stressEmailCount',
              'urgentEmailCount',
              'responseTime',
              'sentimentScore'
            ]
          }
        }
      }
    });
    
  } catch (error) {
    // Log error and return error response
    logger.error('Error in getModelInfo controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
