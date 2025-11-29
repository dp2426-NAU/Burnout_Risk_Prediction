// Prediction controller - Created by Harish S & Team
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { 
  generatePrediction, 
  getLatestPrediction, 
  getPredictionHistory 
} from '../services/prediction.service';
import { logger } from '../utils/logger';

// Interface for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Generate new prediction
export const generateNewPrediction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }
    
    // Get user ID from authenticated request
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Extract prediction parameters from request body
    const { startDate, endDate, additionalData } = req.body;
    
    // Generate prediction
    const result = await generatePrediction({
      userId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      additionalData
    });
    
    if (result.success) {
      // Return success response with prediction data
      res.status(201).json({
        success: true,
        message: 'Prediction generated successfully',
        data: {
          prediction: {
            id: result.prediction!._id,
            predictionDate: result.prediction!.predictionDate,
            riskLevel: result.prediction!.riskLevel,
            riskScore: result.prediction!.riskScore,
            confidence: result.prediction!.confidence,
            factors: result.prediction!.factors,
            recommendations: result.prediction!.recommendations,
            dataPoints: result.prediction!.dataPoints,
            modelVersion: result.prediction!.modelVersion,
            isActive: result.prediction!.isActive,
            createdAt: result.prediction!.createdAt
          }
        }
      });
    } else {
      // Return error response
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
  } catch (error) {
    // Log error and return generic error response
    logger.error('Error in generateNewPrediction controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get latest prediction for user
export const getLatestUserPrediction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Get latest prediction
    const prediction = await getLatestPrediction(userId);
    
    if (!prediction) {
      res.status(404).json({
        success: false,
        message: 'No prediction found for user'
      });
      return;
    }
    
    // Return prediction data
    res.status(200).json({
      success: true,
      data: {
        prediction: {
          id: prediction._id,
          predictionDate: prediction.predictionDate,
          riskLevel: prediction.riskLevel,
          riskScore: prediction.riskScore,
          confidence: prediction.confidence,
          factors: prediction.factors,
          recommendations: prediction.recommendations,
          dataPoints: prediction.dataPoints,
          modelVersion: prediction.modelVersion,
          isActive: prediction.isActive,
          createdAt: prediction.createdAt,
          updatedAt: prediction.updatedAt
        }
      }
    });
    
  } catch (error) {
    // Log error and return generic error response
    logger.error('Error in getLatestUserPrediction controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get prediction history for user
export const getPredictionHistoryForUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Get limit from query parameters
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get prediction history
    const predictions = await getPredictionHistory(userId, limit);
    
    // Return prediction history
    res.status(200).json({
      success: true,
      data: {
        predictions: predictions.map(prediction => ({
          id: prediction._id,
          predictionDate: prediction.predictionDate,
          riskLevel: prediction.riskLevel,
          riskScore: prediction.riskScore,
          confidence: prediction.confidence,
          factors: prediction.factors,
          recommendations: prediction.recommendations,
          dataPoints: prediction.dataPoints,
          modelVersion: prediction.modelVersion,
          isActive: prediction.isActive,
          createdAt: prediction.createdAt
        })),
        count: predictions.length
      }
    });
    
  } catch (error) {
    // Log error and return generic error response
    logger.error('Error in getPredictionHistoryForUser controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get prediction by ID
export const getPredictionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Get prediction ID from request parameters
    const predictionId = req.params.id;
    
    // Get latest prediction (for now, in a real app you'd have a specific getById function)
    const prediction = await getLatestPrediction(userId);
    
    if (!prediction || prediction._id.toString() !== predictionId) {
      res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
      return;
    }
    
    // Return prediction data
    res.status(200).json({
      success: true,
      data: {
        prediction: {
          id: prediction._id,
          predictionDate: prediction.predictionDate,
          riskLevel: prediction.riskLevel,
          riskScore: prediction.riskScore,
          confidence: prediction.confidence,
          factors: prediction.factors,
          recommendations: prediction.recommendations,
          dataPoints: prediction.dataPoints,
          modelVersion: prediction.modelVersion,
          isActive: prediction.isActive,
          createdAt: prediction.createdAt,
          updatedAt: prediction.updatedAt
        }
      }
    });
    
  } catch (error) {
    // Log error and return generic error response
    logger.error('Error in getPredictionById controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get prediction statistics
export const getPredictionStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Get prediction history
    const predictions = await getPredictionHistory(userId, 30); // Last 30 predictions
    
    if (predictions.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No predictions found for user'
      });
      return;
    }
    
    // Calculate statistics
    const totalPredictions = predictions.length;
    const riskLevelCounts = {
      low: predictions.filter(p => p.riskLevel === 'low').length,
      medium: predictions.filter(p => p.riskLevel === 'medium').length,
      high: predictions.filter(p => p.riskLevel === 'high').length,
      critical: predictions.filter(p => p.riskLevel === 'critical').length
    };
    
    const avgRiskScore = predictions.reduce((sum, p) => sum + p.riskScore, 0) / totalPredictions;
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / totalPredictions;
    
    // Get latest prediction
    const latestPrediction = predictions[0];
    
    // Return statistics
    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalPredictions,
          riskLevelCounts,
          avgRiskScore: Math.round(avgRiskScore * 100) / 100,
          avgConfidence: Math.round(avgConfidence * 100) / 100,
          latestRiskLevel: latestPrediction.riskLevel,
          latestRiskScore: latestPrediction.riskScore,
          latestConfidence: latestPrediction.confidence
        }
      }
    });
    
  } catch (error) {
    // Log error and return generic error response
    logger.error('Error in getPredictionStats controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
