import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { loggers } from '../utils/logger';

// Extended request interface to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'patient' | 'doctor' | 'admin' | 'nurse';
    abhaId: string | undefined;
    permissions: string[];
    isVerified: boolean;
  };
}

// JWT token payload interface
interface JWTPayload {
  userId: string;  // Changed from 'id' to 'userId' to match actual token structure
  email: string;
  role: 'patient' | 'doctor' | 'admin' | 'nurse';
  sessionId: string;
  isVerified: boolean;
  iat: number;
  exp: number;
}

// Token validation middleware
export const validateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Access token is required'));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return next(new UnauthorizedError('Access token is required'));
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Check if user account is verified (HIPAA requirement)
    if (!decoded.isVerified) {
      return next(new UnauthorizedError('Account verification required'));
    }

    // Attach user information to request
    req.user = {
      id: decoded.userId,  // Map userId to id for the req.user interface
      email: decoded.email,
      role: decoded.role,
      abhaId: undefined,  // Not included in current JWT payload
      permissions: [],    // Not included in current JWT payload
      isVerified: decoded.isVerified
    };

    next();
  } catch (error: any) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (error.name === 'TokenExpiredError') {
      loggers.security.unauthorized(ipAddress, req.originalUrl, req.get('User-Agent'));
      return next(new UnauthorizedError('Token has expired'));
    }
    
    if (error.name === 'JsonWebTokenError') {
      loggers.security.unauthorized(ipAddress, req.originalUrl, req.get('User-Agent'));
      return next(new UnauthorizedError('Invalid token'));
    }

    // Log other authentication errors
    loggers.security.unauthorized(ipAddress, req.originalUrl, req.get('User-Agent'));
    next(error);
  }
};

// Role-based access control middleware
export const requireRole = (...roles: Array<'patient' | 'doctor' | 'admin' | 'nurse'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      loggers.security.unauthorized(ipAddress, req.originalUrl, req.get('User-Agent'));
      return next(new ForbiddenError(`Access restricted to: ${roles.join(', ')}`));
    }

    next();
  };
};

// Permission-based access control middleware
export const requirePermission = (...permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(permission => 
      userPermissions.includes(permission) || 
      userPermissions.includes('*') // Admin wildcard permission
    );

    if (!hasPermission) {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      loggers.security.unauthorized(ipAddress, req.originalUrl, req.get('User-Agent'));
      return next(new ForbiddenError(`Insufficient permissions. Required: ${permissions.join(', ')}`));
    }

    next();
  };
};

// HIPAA-compliant patient data access control
export const requirePatientAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
  
  if (!patientId) {
    return next(new UnauthorizedError('Patient ID required'));
  }

  // Patients can only access their own data
  if (req.user.role === 'patient' && req.user.id !== patientId) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    loggers.security.suspiciousActivity(
      req.user.id,
      'Attempted access to another patient\'s data',
      ipAddress,
      { targetPatientId: patientId, userRole: req.user.role }
    );
    return next(new ForbiddenError('Access denied: Cannot access another patient\'s data'));
  }

  // Doctors and nurses need explicit patient-doctor relationship (to be implemented)
  if (req.user.role === 'doctor' || req.user.role === 'nurse') {
    // TODO: Implement patient-doctor relationship validation
    // For now, allow access (should be restricted in production)
  }

  // Admins have full access (with proper logging)
  if (req.user.role === 'admin') {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    loggers.patient.access(req.user.id, patientId as string, ipAddress);
  }

  next();
};

// Medical record access control
export const requireMedicalRecordAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const recordId = req.params.recordId || req.body.recordId || req.query.recordId;
  const patientId = req.params.patientId || req.body.patientId || req.query.patientId;

  if (!recordId) {
    return next(new UnauthorizedError('Medical record ID required'));
  }

  // Log all medical record access attempts
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (patientId) {
    loggers.medicalRecord.access(req.user.id, recordId as string, patientId as string, ipAddress);
  }

  // Apply patient access control
  requirePatientAccess(req, res, next);
};

// QR code access validation (for temporary access to medical records)
export const validateQRAccess = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const qrToken = req.query.token as string;
    
    if (!qrToken) {
      return next(new UnauthorizedError('QR access token required'));
    }

    // Verify QR token (shorter expiration for security)
    const decoded = jwt.verify(qrToken, config.jwt.secret) as any;
    
    // QR tokens should have specific scope
    if (!decoded.scope || decoded.scope !== 'qr_access') {
      return next(new UnauthorizedError('Invalid QR access token'));
    }

    // Add QR-specific user context
    (req as any).qrAccess = {
      recordId: decoded.recordId,
      patientId: decoded.patientId,
      permissions: decoded.permissions || ['read'],
      expiresAt: new Date(decoded.exp * 1000)
    };

    next();
  } catch (error: any) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    loggers.security.unauthorized(ipAddress, req.originalUrl, req.get('User-Agent'));
    
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('QR access token has expired'));
    }
    
    next(new UnauthorizedError('Invalid QR access token'));
  }
};

// ABHA (Ayushman Bharat Health Account) verification middleware
export const requireABHAVerification = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (!req.user.abhaId) {
    return next(new ForbiddenError('ABHA verification required for this operation'));
  }

  // TODO: Implement ABHA token validation with ABDM servers
  // For now, just check if ABHA ID exists

  next();
};

// Optional JWT validation (for public endpoints that benefit from user context)
export const optionalJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
        req.user = {
          id: decoded.userId,  // Map userId to id for the req.user interface
          email: decoded.email,
          role: decoded.role,
          abhaId: undefined,  // Not included in current JWT payload
          permissions: [],    // Not included in current JWT payload
          isVerified: decoded.isVerified
        };
      }
    }
  } catch (error) {
    // Silently ignore JWT errors for optional authentication
  }
  
  next();
};

// Generate JWT token utility
export const generateJWT = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret as string, {
    expiresIn: config.jwt.expiresIn
  } as jwt.SignOptions);
};

// Generate refresh token utility
export const generateRefreshToken = (payload: { id: string; email: string }): string => {
  return jwt.sign(payload, config.jwt.refreshSecret as string, {
    expiresIn: config.jwt.refreshExpiresIn
  } as jwt.SignOptions);
};

// Generate QR access token utility
export const generateQRToken = (recordId: string, patientId: string, permissions: string[] = ['read']): string => {
  return jwt.sign(
    {
      recordId,
      patientId,
      permissions,
      scope: 'qr_access'
    },
    config.jwt.secret,
    { expiresIn: '1h' } // QR tokens expire in 1 hour for security
  );
};
