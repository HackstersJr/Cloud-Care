import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  apiClient, 
  User, 
  StandardLoginData, 
  DoctorLoginData, 
  ABHALoginData, 
  RegisterData
} from '../utils/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  
  // Authentication methods
  login: (credentials: StandardLoginData) => Promise<void>;
  doctorLogin: (credentials: DoctorLoginData) => Promise<void>;
  abhaLogin: (credentials: ABHALoginData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile management
  updateProfile: (data: Partial<User>) => Promise<void>;
  
  // Utility methods
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (apiClient.isAuthenticated()) {
        const response = await apiClient.getProfile();
        if (response.status === 'success' && response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          // Invalid token, clear auth state
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: StandardLoginData) => {
    try {
      setLoading(true);
      const response = await apiClient.login(credentials);
      
      if (response.status === 'success' && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const doctorLogin = async (credentials: DoctorLoginData) => {
    try {
      setLoading(true);
      const response = await apiClient.doctorLogin(credentials);
      
      if (response.status === 'success' && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Doctor login failed');
      }
    } catch (error) {
      console.error('Doctor login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const abhaLogin = async (credentials: ABHALoginData) => {
    try {
      setLoading(true);
      const response = await apiClient.abhaLogin(credentials);
      
      if (response.status === 'success' && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'ABHA login failed');
      }
    } catch (error) {
      console.error('ABHA login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await apiClient.register(userData);
      
      if (response.status === 'success' && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await apiClient.updateProfile(data);
      
      if (response.status === 'success' && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      loading,
      login, 
      doctorLogin,
      abhaLogin,
      register,
      logout,
      updateProfile,
      checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}