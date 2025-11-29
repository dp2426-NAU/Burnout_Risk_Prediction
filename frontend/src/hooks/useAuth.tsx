// Authentication hook - Created by Harish S & Team
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';

// User interface
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // State for user, token, and loading
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Initialize authentication state
  const initializeAuth = async () => {
    try {
      // Get token from localStorage
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        // Verify token and get user profile
        const userData = await authService.getProfile(storedToken);
        
        if (userData) {
          setUser(userData);
          setToken(storedToken);
        } else {
          // Invalid token, clear storage
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Clear invalid token
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Call login service
      const result = await authService.login(email, password);
      
      if (result.success && result.data) {
        // Set user and token
        setUser(result.data.user);
        setToken(result.data.token);
        
        // Store token in localStorage
        localStorage.setItem('token', result.data.token);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Call register service
      const result = await authService.register(email, password, firstName, lastName);
      
      if (result.success && result.data) {
        // Set user and token
        setUser(result.data.user);
        setToken(result.data.token);
        
        // Store token in localStorage
        localStorage.setItem('token', result.data.token);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
  };

  // Update profile function
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      if (!token) return false;
      
      // Call update profile service
      const result = await authService.updateProfile(data, token);
      
      if (result.success && result.data) {
        // Update user state
        setUser(result.data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}