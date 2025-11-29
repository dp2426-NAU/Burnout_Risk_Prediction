// Authentication service - Created by Harish S & Team
import { apiClient, ApiResponse } from './apiClient';

// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

// Login request interface
interface LoginRequest {
  email: string;
  password: string;
}

// Register request interface
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

// Login response interface
interface LoginResponse {
  user: User;
  token: string;
}

// Register response interface
interface RegisterResponse {
  user: User;
  token: string;
}

// Update profile request interface
interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Change password request interface
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Authentication service class
class AuthService {
  // Login user
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const request: LoginRequest = { email, password };
    return await apiClient.post<LoginResponse>('/auth/login', request);
  }

  // Register user
  async register(
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string,
    role: string = 'user'
  ): Promise<ApiResponse<RegisterResponse>> {
    const request: RegisterRequest = { 
      email, 
      password, 
      firstName, 
      lastName, 
      role 
    };
    return await apiClient.post<RegisterResponse>('/auth/register', request);
  }

  // Get user profile
  async getProfile(token: string): Promise<User | null> {
    try {
      // Set auth token for this request
      apiClient.setAuthToken(token);
      
      const response = await apiClient.get<{ user: User }>('/auth/profile');
      
      if (response.success && response.data) {
        return response.data.user;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(
    data: UpdateProfileRequest, 
    token: string
  ): Promise<ApiResponse<{ user: User }>> {
    // Set auth token for this request
    apiClient.setAuthToken(token);
    
    return await apiClient.put<{ user: User }>('/auth/profile', data);
  }

  // Change password
  async changePassword(
    currentPassword: string, 
    newPassword: string, 
    token: string
  ): Promise<ApiResponse> {
    // Set auth token for this request
    apiClient.setAuthToken(token);
    
    const request: ChangePasswordRequest = { currentPassword, newPassword };
    return await apiClient.put('/auth/password', request);
  }

  // Deactivate account
  async deactivateAccount(token: string): Promise<ApiResponse> {
    // Set auth token for this request
    apiClient.setAuthToken(token);
    
    return await apiClient.delete('/auth/account');
  }

  // Logout (client-side only)
  logout() {
    // Clear auth token
    apiClient.clearAuthToken();
    
    // Clear localStorage
    localStorage.removeItem('token');
  }
}

// Create and export auth service instance
export const authService = new AuthService();
