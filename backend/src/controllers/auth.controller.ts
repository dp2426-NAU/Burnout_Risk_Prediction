// Authentication controller - Created by Harish S & Team
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { 
  registerUser, 
  loginUser, 
  updateUserProfile, 
  changePassword, 
  deactivateUser,
  getUserById 
} from '../services/auth.service';
import { logger } from '../utils/logger';

// Interface for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
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
    
    // Extract user data from request body
    const { email, password, firstName, lastName, role } = req.body;
    
    // Register user
    const result = await registerUser(email, password, firstName, lastName, role);
    
    if (result.success) {
      // Return success response with user data (excluding password)
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: result.user!._id,
            email: result.user!.email,
            firstName: result.user!.firstName,
            lastName: result.user!.lastName,
            role: result.user!.role,
            isActive: result.user!.isActive,
            createdAt: result.user!.createdAt
          },
          token: result.token
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
    logger.error('Error in register controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
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
    
    // Extract login credentials from request body
    const { email, password } = req.body;
    
    // Authenticate user
    const result = await loginUser(email, password);
    
    if (result.success) {
      // Return success response with user data (excluding password)
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: result.user!._id,
            email: result.user!.email,
            firstName: result.user!.firstName,
            lastName: result.user!.lastName,
            role: result.user!.role,
            isActive: result.user!.isActive,
            lastLogin: result.user!.lastLogin
          },
          token: result.token
        }
      });
    } else {
      // Return error response
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
    
  } catch (error) {
    // Log error and return generic error response
    logger.error('Error in login controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user profile
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    
    // Get user by ID
    const user = await getUserById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Return user profile (excluding password)
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
    
  } catch (error) {
    // Log error and return generic error response
    logger.error('Error in getProfile controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    
    // Extract update data from request body
    const { firstName, lastName, email } = req.body;
    
    // Update user profile
    const result = await updateUserProfile(userId, {
      firstName,
      lastName,
      email
    });
    
    if (result.success) {
      // Return success response with updated user data
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: result.user!._id,
            email: result.user!.email,
            firstName: result.user!.firstName,
            lastName: result.user!.lastName,
            role: result.user!.role,
            isActive: result.user!.isActive,
            updatedAt: result.user!.updatedAt
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
    logger.error('Error in updateProfile controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change user password
export const changeUserPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    
    // Extract password data from request body
    const { currentPassword, newPassword } = req.body;
    
    // Change password
    const result = await changePassword(userId, currentPassword, newPassword);
    
    if (result.success) {
      // Return success response
      res.status(200).json({
        success: true,
        message: result.message
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
    logger.error('Error in changePassword controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Deactivate user account
export const deactivateAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    
    // Deactivate user account
    const result = await deactivateUser(userId);
    
    if (result.success) {
      // Return success response
      res.status(200).json({
        success: true,
        message: result.message
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
    logger.error('Error in deactivateAccount controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
