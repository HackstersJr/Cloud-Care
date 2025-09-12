import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, User } from '../utils/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginDoctor: (credentials: DoctorCredentials) => Promise<boolean>;
  loginABHA: (credentials: ABHACredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  sendOTP: (method: 'mobile' | 'email', value: string) => Promise<boolean>;
  verifyOTP: (method: 'mobile' | 'email', value: string, otp: string) => Promise<boolean>;
  clearError: () => void;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface DoctorCredentials {
  facilityId: string;
  password: string;
  captcha: string;
}

interface ABHACredentials {
  method: 'mobile' | 'abha-address' | 'abha-number' | 'email';
  value: string;
  otp?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication state from stored tokens
   */
  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      if (apiClient.isAuthenticated()) {
        // Try to get user profile to validate token
        const response = await apiClient.getProfile();
        
        if (response.status === 'success' && response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear auth state
          await logout();
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Regular user login (email/password)
   */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.login(credentials);

      if (response.status === 'success' && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(response.message || 'Login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Doctor login with facility credentials
   */
  const loginDoctor = async (credentials: DoctorCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.doctorLogin(credentials);

      if (response.status === 'success' && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(response.message || 'Doctor login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Doctor login failed';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * ABHA login for patients
   */
  const loginABHA = async (credentials: ABHACredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.abhaLogin(credentials);

      if (response.status === 'success' && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(response.message || 'ABHA login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ABHA login failed';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send OTP for authentication
   */
  const sendOTP = async (method: 'mobile' | 'email', value: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.sendOTP({ method, value });

      if (response.status === 'success') {
        return true;
      } else {
        setError(response.message || 'Failed to send OTP');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP
   */
  const verifyOTP = async (method: 'mobile' | 'email', value: string, otp: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.verifyOTP({ method, value, otp });

      if (response.status === 'success' && response.data?.verified) {
        return true;
      } else {
        setError(response.message || 'OTP verification failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * User logout
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiClient.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    loginDoctor,
    loginABHA,
    logout,
    sendOTP,
    verifyOTP,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
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