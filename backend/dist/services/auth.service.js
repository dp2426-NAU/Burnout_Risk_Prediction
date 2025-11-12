"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.verifyToken = verifyToken;
exports.getUserById = getUserById;
exports.updateUserProfile = updateUserProfile;
exports.changePassword = changePassword;
exports.deactivateUser = deactivateUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
async function registerUser(email, password, firstName, lastName, role = 'user') {
    try {
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            return {
                success: false,
                message: 'User with this email already exists'
            };
        }
        const user = new user_model_1.User({
            email,
            password,
            firstName,
            lastName,
            role
        });
        await user.save();
        const token = generateToken(user);
        logger_1.logger.info(`User registered successfully: ${email}`);
        return {
            success: true,
            user,
            token
        };
    }
    catch (error) {
        logger_1.logger.error('Error during user registration:', error);
        return {
            success: false,
            message: 'Registration failed. Please try again.'
        };
    }
}
async function loginUser(email, password) {
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await user_model_1.User.findOne({ email: normalizedEmail }).select('+password');
        if (!user) {
            logger_1.logger.warn(`Login attempt failed: User not found for email ${normalizedEmail}`);
            return {
                success: false,
                message: 'Invalid email or password'
            };
        }
        if (!user.isActive) {
            return {
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            };
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            logger_1.logger.warn(`Login attempt failed: Invalid password for email ${normalizedEmail}`);
            return {
                success: false,
                message: 'Invalid email or password'
            };
        }
        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(user);
        logger_1.logger.info(`User logged in successfully: ${normalizedEmail}`);
        return {
            success: true,
            user,
            token
        };
    }
    catch (error) {
        logger_1.logger.error('Error during user login:', error);
        return {
            success: false,
            message: 'Login failed. Please try again.'
        };
    }
}
function generateToken(user) {
    try {
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        };
        const token = jsonwebtoken_1.default.sign(payload, env_1.JWT_SECRET, { expiresIn: env_1.JWT_EXPIRES_IN });
        return token;
    }
    catch (error) {
        logger_1.logger.error('Error generating JWT token:', error);
        throw new Error('Token generation failed');
    }
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        logger_1.logger.error('Error verifying JWT token:', error);
        return null;
    }
}
async function getUserById(userId) {
    try {
        const user = await user_model_1.User.findById(userId);
        return user;
    }
    catch (error) {
        logger_1.logger.error('Error getting user by ID:', error);
        return null;
    }
}
async function updateUserProfile(userId, updateData) {
    try {
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        if (updateData.firstName)
            user.firstName = updateData.firstName;
        if (updateData.lastName)
            user.lastName = updateData.lastName;
        if (updateData.email) {
            const existingUser = await user_model_1.User.findOne({
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
        await user.save();
        logger_1.logger.info(`User profile updated successfully: ${user.email}`);
        return {
            success: true,
            user
        };
    }
    catch (error) {
        logger_1.logger.error('Error updating user profile:', error);
        return {
            success: false,
            message: 'Profile update failed. Please try again.'
        };
    }
}
async function changePassword(userId, currentPassword, newPassword) {
    try {
        const user = await user_model_1.User.findById(userId).select('+password');
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return {
                success: false,
                message: 'Current password is incorrect'
            };
        }
        user.password = newPassword;
        await user.save();
        logger_1.logger.info(`User password changed successfully: ${user.email}`);
        return {
            success: true,
            message: 'Password changed successfully'
        };
    }
    catch (error) {
        logger_1.logger.error('Error changing password:', error);
        return {
            success: false,
            message: 'Password change failed. Please try again.'
        };
    }
}
async function deactivateUser(userId) {
    try {
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        user.isActive = false;
        await user.save();
        logger_1.logger.info(`User account deactivated: ${user.email}`);
        return {
            success: true,
            message: 'Account deactivated successfully'
        };
    }
    catch (error) {
        logger_1.logger.error('Error deactivating user:', error);
        return {
            success: false,
            message: 'Account deactivation failed. Please try again.'
        };
    }
}
//# sourceMappingURL=auth.service.js.map