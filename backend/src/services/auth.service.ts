// Authentication service - Created by Harish S & Team
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env';
import { logger } from '../utils/logger';

// Interface for authentication result
export interface AuthResult {
  success: boolean;
  user?: IUser;
  token?: string;
  message?: string;
}

// Interface for JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Function to register a new user
export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: 'admin' | 'user' | 'manager' = 'user'
): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists'
      };
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role
    });
    
    // Save user to database
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Log successful registration
    logger.info(`User registered successfully: ${email}`);
    
    return {
      success: true,
      user,
      token
    };
    
  } catch (error) {
    // Log registration error
    logger.error('Error during user registration:', error);
    
    return {
      success: false,
      message: 'Registration failed. Please try again.'
    };
  }
}

// Function to authenticate user login
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Normalize email (lowercase and trim) to match schema
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email and include password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      logger.warn(`Login attempt failed: User not found for email ${normalizedEmail}`);
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }
    
    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      };
    }
    
    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Login attempt failed: Invalid password for email ${normalizedEmail}`);
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Log successful login
    logger.info(`User logged in successfully: ${normalizedEmail}`);
    
    return {
      success: true,
      user,
      token
    };
    
  } catch (error) {
    // Log login error
    logger.error('Error during user login:', error);
    
    return {
      success: false,
      message: 'Login failed. Please try again.'
    };
  }
}

// Function to generate JWT token
function generateToken(user: IUser): string {
  try {
    // Create JWT payload
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };
    
    // Generate token with secret and expiration
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    
    return token;
    
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw new Error('Token generation failed');
  }
}

// Function to verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    // Verify token with secret
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
    
  } catch (error) {
    // Log token verification error
    logger.error('Error verifying JWT token:', error);
    return null;
  }
}

// Function to get user by ID
export async function getUserById(userId: string): Promise<IUser | null> {
  try {
    // Find user by ID
    const user = await User.findById(userId);
    return user;
    
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    return null;
  }
}

// Function to update user profile
export async function updateUserProfile(
  userId: string,
  updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }
): Promise<AuthResult> {
  try {
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Update user fields
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return {
          success: false,
          message: 'Email is already taken'
        };
      }
      user.email = updateData.email;
    }
    
    // Save updated user
    await user.save();
    
    // Log successful update
    logger.info(`User profile updated successfully: ${user.email}`);
    
    return {
      success: true,
      user
    };
    
  } catch (error) {
    logger.error('Error updating user profile:', error);
    return {
      success: false,
      message: 'Profile update failed. Please try again.'
    };
  }
}

// Function to change user password
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<AuthResult> {
  try {
    // Find user by ID and include password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        message: 'Current password is incorrect'
      };
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Log successful password change
    logger.info(`User password changed successfully: ${user.email}`);
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
    
  } catch (error) {
    logger.error('Error changing password:', error);
    return {
      success: false,
      message: 'Password change failed. Please try again.'
    };
  }
}

// Function to deactivate user account
export async function deactivateUser(userId: string): Promise<AuthResult> {
  try {
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Deactivate user
    user.isActive = false;
    await user.save();
    
    // Log successful deactivation
    logger.info(`User account deactivated: ${user.email}`);
    
    return {
      success: true,
      message: 'Account deactivated successfully'
    };
    
  } catch (error) {
    logger.error('Error deactivating user:', error);
    return {
      success: false,
      message: 'Account deactivation failed. Please try again.'
    };
  }
}
