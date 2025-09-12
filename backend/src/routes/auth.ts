import { Router, Request, Response } from 'express';
import { authService } from '../services/auth';
import { validateJWT, optionalJWT } from '../middleware/auth';
import { loggers } from '../utils/logger';

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

export default router;
