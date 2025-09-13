import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authService } from '../services/auth';
import { validateJWT, optionalJWT } from '../middleware/auth';
import { loggers, logger } from '../utils/logger';
import { prisma } from '../services/prisma';

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Basic validation
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: email, password, firstName, lastName, role',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate role
    if (!['patient', 'doctor', 'nurse'].includes(role)) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'INVALID_ROLE',
          message: 'Role must be one of: patient, doctor, nurse',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'INVALID_EMAIL',
          message: 'Invalid email format',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long',
          timestamp: new Date().toISOString()
        }
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      phone,
      role
    }, ipAddress);

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: result.user,
        tokens: result.tokens
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    loggers.auth.login('unknown', req.ip || 'unknown', false);
    
    return res.status(400).json({
      error: {
        status: 'error',
        statusCode: 400,
        code: 'REGISTRATION_FAILED',
        message: error.message || 'Registration failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const result = await authService.login({ email, password }, ipAddress);

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: result.tokens
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(401).json({
      error: {
        status: 'error',
        statusCode: 401,
        code: 'LOGIN_FAILED',
        message: error.message || 'Invalid credentials',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Logout endpoint
router.post('/logout', validateJWT, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await authService.logout(refreshToken, ipAddress);

    return res.status(200).json({
      status: 'success',
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(400).json({
      error: {
        status: 'error',
        statusCode: 400,
        code: 'LOGOUT_FAILED',
        message: error.message || 'Logout failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const tokens = await authService.refreshToken(refreshToken, ipAddress);

    return res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: { tokens },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(401).json({
      error: {
        status: 'error',
        statusCode: 401,
        code: 'TOKEN_REFRESH_FAILED',
        message: error.message || 'Token refresh failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Change password endpoint
router.put('/change-password', validateJWT, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user?.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_PASSWORDS',
          message: 'Current password and new password are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'WEAK_PASSWORD',
          message: 'New password must be at least 8 characters long',
          timestamp: new Date().toISOString()
        }
      });
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(400).json({
      error: {
        status: 'error',
        statusCode: 400,
        code: 'PASSWORD_CHANGE_FAILED',
        message: error.message || 'Password change failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Reset password request endpoint
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_EMAIL',
          message: 'Email is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const resetToken = await authService.resetPassword(email);

    return res.status(200).json({
      status: 'success',
      message: 'If the email exists, a reset link has been sent',
      data: {
        // In development, return the token. In production, this should be sent via email
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'RESET_REQUEST_FAILED',
        message: 'Password reset request failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get current user profile
router.get('/me', validateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          role: user.role,
          sessionId: user.sessionId
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to fetch user profile',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Auth status endpoint (public)
router.get('/status', optionalJWT, (req: Request, res: Response) => {
  const user = (req as any).user;
  
  res.status(200).json({
    status: 'success',
    data: {
      authenticated: !!user,
      user: user ? {
        userId: user.userId,
        email: user.email,
        role: user.role
      } : null
    },
    timestamp: new Date().toISOString()
  });
});

// Send OTP endpoint for ABHA authentication
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { method, value } = req.body;

    if (!method || !value) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_PARAMETERS',
          message: 'Method and value are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate method
    if (!['mobile', 'email', 'abha-address', 'abha-number'].includes(method)) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'INVALID_METHOD',
          message: 'Method must be one of: mobile, email, abha-address, abha-number',
          timestamp: new Date().toISOString()
        }
      });
    }

    // For development/testing, return success with mock data
    logger.info(`OTP send request - Method: ${method}, Value: ${value}`);

    return res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully',
      data: {
        txnId: 'mock-txn-id-' + Date.now(),
        message: `OTP sent to ${value}`,
        expiresIn: 300 // 5 minutes
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'OTP_SEND_FAILED',
        message: 'Failed to send OTP',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Verify OTP endpoint for ABHA authentication
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { method, value, otp, txnId } = req.body;

    if (!method || !value || !otp) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_PARAMETERS',
          message: 'Method, value, and OTP are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // For development/testing, accept OTP 123456
    if (otp === '123456') {
      logger.info(`OTP verification successful - Method: ${method}, Value: ${value}`);

      return res.status(200).json({
        status: 'success',
        message: 'OTP verified successfully',
        data: {
          verified: true,
          authToken: 'mock-auth-token-' + Date.now(),
          userInfo: {
            healthId: value.includes('@') ? value : `healthid-${Date.now()}`,
            method: method,
            verified: true
          }
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'INVALID_OTP',
          message: 'Invalid OTP provided',
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error: any) {
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'OTP_VERIFICATION_FAILED',
        message: 'Failed to verify OTP',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// ABHA login endpoint (combines OTP verification and user authentication)
router.post('/abha-login', async (req: Request, res: Response) => {
  try {
    const { method, value, otp } = req.body;

    if (!method || !value) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_PARAMETERS',
          message: 'Method and value are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate method
    if (!['mobile', 'email', 'abha-address', 'abha-number'].includes(method)) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'INVALID_METHOD',
          message: 'Method must be one of: mobile, email, abha-address, abha-number',
          timestamp: new Date().toISOString()
        }
      });
    }

    // If OTP is provided, verify it; otherwise, this is just registration/profile lookup
    if (otp) {
      if (otp !== '123456') {
        return res.status(400).json({
          error: {
            status: 'error',
            statusCode: 400,
            code: 'INVALID_OTP',
            message: 'Invalid OTP provided',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // For development/testing, try to find existing user first
    const email = method === 'email' ? value : `${value.replace(/[^a-zA-Z0-9]/g, '')}@abha.gov.in`;
    
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: email }
      });
    } catch (dbError) {
      console.warn('Database lookup failed, proceeding with mock user');
    }

    let user;
    if (existingUser) {
      // Use existing user
      user = existingUser;
      logger.info(`ABHA login - Found existing user: ${user.id}`);
    } else {
      // Create mock user profile for development
      user = {
        id: uuidv4(), // Generate proper UUID
        email: email,
        firstName: 'ABHA',
        lastName: 'User',
        role: 'patient',
        phoneNumber: method === 'mobile' ? value : '+91' + Math.floor(Math.random() * 10000000000),
        abhaId: value.includes('@') ? value : `abha-${Date.now()}`,
        healthId: value.includes('@') ? value : `healthid-${Date.now()}`,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      logger.info(`ABHA login - Created mock user: ${user.id}`);
    }

    // Generate JWT tokens with consistent structure
    const tokenPayload = {
      userId: user.id,  // Use consistent field name
      email: user.email,
      role: user.role,
      sessionId: uuidv4(),  // Add session ID like standard login
      isVerified: true
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, sessionId: tokenPayload.sessionId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );

    const tokens = {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    };

    logger.info(`ABHA login successful - Method: ${method}, Value: ${value}, User: ${user.id}`);

    return res.status(200).json({
      status: 'success',
      message: 'ABHA login successful',
      data: {
        user: user,
        tokens: tokens
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'ABHA_LOGIN_FAILED',
        message: 'ABHA login failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Doctor login endpoint with facility credentials
router.post('/doctor-login', async (req: Request, res: Response) => {
  try {
    const { facilityId, password, captcha } = req.body;

    if (!facilityId || !password || !captcha) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_CREDENTIALS',
          message: 'Facility ID, password, and captcha are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Simple captcha validation (for development)
    // In production, this should be more sophisticated
    if (captcha !== 'doctor123') {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'INVALID_CAPTCHA',
          message: 'Invalid captcha provided',
          timestamp: new Date().toISOString()
        }
      });
    }

    // For development/testing, create mock doctor credentials
    const mockDoctorCredentials = {
      'HOSP001': { password: 'doctor123', name: 'Dr. Sarah Wilson', email: 'dr.sarah@cloudcare.com' },
      'HOSP002': { password: 'doctor123', name: 'Dr. John Smith', email: 'dr.john@cloudcare.com' },
      'CLINIC001': { password: 'doctor123', name: 'Dr. Emergency', email: 'dr.emergency@cloudcare.com' },
      'TEST001': { password: 'doctor123', name: 'Dr. Test Doctor', email: 'dr.test@cloudcare.com' }
    };

    const facilityData = mockDoctorCredentials[facilityId as keyof typeof mockDoctorCredentials];

    if (!facilityData || facilityData.password !== password) {
      return res.status(401).json({
        error: {
          status: 'error',
          statusCode: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid facility ID or password',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Create mock doctor user
    const mockDoctor = {
      userId: uuidv4(), // Generate proper UUID
      email: facilityData.email,
      firstName: facilityData.name.split(' ')[1] || 'Doctor',
      lastName: facilityData.name.split(' ').slice(2).join(' ') || 'User',
      role: 'doctor',
      facilityId: facilityId,
      facilityName: `Healthcare Facility ${facilityId}`,
      specialization: 'General Medicine',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Generate real JWT tokens for doctor
    const tokenPayload = {
      id: mockDoctor.userId,
      email: mockDoctor.email,
      role: mockDoctor.role,
      facilityId: facilityId,
      permissions: ['doctor:read', 'doctor:write', 'patient:read', 'patient:write'],
      isVerified: true
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: mockDoctor.userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );

    const tokens = {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    };

    logger.info(`Doctor login successful - Facility: ${facilityId}, Doctor: ${mockDoctor.userId}`);

    return res.status(200).json({
      status: 'success',
      message: 'Doctor login successful',
      data: {
        user: mockDoctor,
        tokens: tokens
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'DOCTOR_LOGIN_FAILED',
        message: 'Doctor login failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get user profile endpoint
router.get('/profile', validateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        error: {
          status: 'error',
          statusCode: 401,
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Return user profile data
    return res.status(200).json({
      status: 'success',
      data: {
        id: user.id || user.userId,
        email: user.email,
        firstName: user.firstName || 'User',
        lastName: user.lastName || '',
        role: user.role,
        phone: user.phone || '',
        abhaId: user.abhaId || '',
        facilityId: user.facilityId || null,
        isVerified: user.isVerified || false,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to fetch user profile',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
