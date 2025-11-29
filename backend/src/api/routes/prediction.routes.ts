// Prediction routes - Created by Harish S & Team
import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  generateNewPrediction,
  getLatestUserPrediction,
  getPredictionHistoryForUser,
  getPredictionById,
  getPredictionStats
} from '../../controllers/prediction.controller';
import { verifyToken } from '../../services/auth.service';

// Create router instance
const router = Router();

// Validation middleware for prediction generation
const generatePredictionValidation = [
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('additionalData.sleepQuality')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Sleep quality must be between 0 and 10'),
  body('additionalData.exerciseFrequency')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Exercise frequency must be between 0 and 10'),
  body('additionalData.nutritionQuality')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Nutrition quality must be between 0 and 10'),
  body('additionalData.socialSupport')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Social support must be between 0 and 10'),
  body('additionalData.jobSatisfaction')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Job satisfaction must be between 0 and 10')
];

// Validation middleware for query parameters
const historyQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Add user info to request
    req.user = decoded;
    next();
    
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// All prediction routes require authentication
router.use(authenticateToken);

// Generate new prediction
router.post('/', generatePredictionValidation, generateNewPrediction);

// Get latest prediction for user
router.get('/latest', getLatestUserPrediction);

// Get prediction history for user
router.get('/history', historyQueryValidation, getPredictionHistoryForUser);

// Get prediction by ID
router.get('/:id', getPredictionById);

// Get prediction statistics for user
router.get('/stats/overview', getPredictionStats);

// Export router
export default router;
