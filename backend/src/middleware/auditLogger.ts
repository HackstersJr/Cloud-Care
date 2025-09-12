import { Request, Response, NextFunction } from 'express';
import { loggers } from '../utils/logger';

// Extended request interface to include user information
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    abhaId?: string;
  };
}

// HIPAA audit logging middleware
export const auditLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Extract request information
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const method = req.method;
  const url = req.originalUrl;
  const userId = req.user?.id || 'anonymous';

  // Override res.send to capture response
  res.send = function(body: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const statusCode = res.statusCode;

    // Determine if this request involves Protected Health Information (PHI)
    const isPHIRelated = isRequestPHIRelated(url, method);
    
    // Log only PHI-related requests and security-sensitive operations
    if (isPHIRelated || isSecuritySensitive(url, method)) {
      const auditData = {
        timestamp: new Date().toISOString(),
        userId,
        method,
        url: sanitizeUrl(url),
        statusCode,
        responseTime,
        ipAddress,
        userAgent,
        isPHI: isPHIRelated,
        requestSize: req.get('content-length') || 0,
        responseSize: Buffer.byteLength(body || ''),
      };

      // Log specific actions based on the endpoint
      logSpecificAction(req, auditData);
    }

    // Call original send method
    return originalSend.call(this, body);
  };

  next();
};

// Determine if request involves PHI
function isRequestPHIRelated(url: string, method: string): boolean {
  const phiEndpoints = [
    '/patients',
    '/medical-records',
    '/doctors',
    '/abha',
    '/qr'
  ];

  return phiEndpoints.some(endpoint => url.includes(endpoint));
}

// Determine if request is security sensitive
function isSecuritySensitive(url: string, method: string): boolean {
  const securityEndpoints = [
    '/auth',
    '/login',
    '/logout',
    '/register',
    '/password',
    '/token'
  ];

  return securityEndpoints.some(endpoint => url.includes(endpoint));
}

// Sanitize URL to remove sensitive parameters
function sanitizeUrl(url: string): string {
  const urlParts = url.split('?');
  const baseUrl = urlParts[0] || '';
  
  if (urlParts.length > 1) {
    const queryParams = new URLSearchParams(urlParts[1]);
    
    // Remove sensitive parameters
    const sensitiveParams = ['token', 'password', 'ssn', 'dob', 'phone'];
    sensitiveParams.forEach(param => {
      if (queryParams.has(param)) {
        queryParams.set(param, '[REDACTED]');
      }
    });
    
    return `${baseUrl}?${queryParams.toString()}`;
  }
  
  return baseUrl;
}

// Log specific actions based on endpoint and method
function logSpecificAction(req: AuthenticatedRequest, auditData: any): void {
  const { url, method } = req;
  const userId = req.user?.id || 'anonymous';
  const ipAddress = auditData.ipAddress;

  // Extract IDs from URL path
  const pathSegments = url.split('/').filter(segment => segment.length > 0);
  
  // Patient-related actions
  if (url.includes('/patients')) {
    const patientId = extractIdFromPath(pathSegments, 'patients');
    
    switch (method) {
      case 'GET':
        if (patientId) {
          loggers.patient.access(userId, patientId, ipAddress);
        }
        break;
      case 'PUT':
      case 'PATCH':
        if (patientId) {
          loggers.patient.update(userId, patientId, ['profile_update'], ipAddress);
        }
        break;
    }
  }

  // Medical record actions
  if (url.includes('/medical-records')) {
    const recordId = extractIdFromPath(pathSegments, 'medical-records');
    const patientId = req.body?.patientId || req.query?.patientId as string;
    
    switch (method) {
      case 'GET':
        if (recordId && patientId) {
          loggers.medicalRecord.access(userId, recordId, patientId, ipAddress);
        }
        break;
      case 'POST':
        if (patientId) {
          loggers.medicalRecord.create(userId, recordId || 'pending', patientId, ipAddress);
        }
        break;
      case 'PUT':
      case 'PATCH':
        if (recordId && patientId) {
          loggers.medicalRecord.update(userId, recordId, patientId, ['record_update'], ipAddress);
        }
        break;
      case 'DELETE':
        if (recordId && patientId) {
          loggers.medicalRecord.delete(userId, recordId, patientId, ipAddress);
        }
        break;
    }
  }

  // QR code actions
  if (url.includes('/qr')) {
    const recordId = req.body?.recordId || req.query?.recordId as string;
    const patientId = req.body?.patientId || req.query?.patientId as string;
    
    if (method === 'POST' && recordId && patientId) {
      loggers.qr.generate(userId, recordId, patientId, ipAddress);
    }
    
    if (method === 'GET' && recordId && patientId) {
      const qrToken = req.query?.token as string || 'unknown';
      loggers.qr.access(recordId, patientId, ipAddress, qrToken);
    }
  }

  // Authentication actions
  if (url.includes('/auth')) {
    if (url.includes('/login') && method === 'POST') {
      const success = auditData.statusCode < 400;
      loggers.auth.login(userId, ipAddress, success);
    }
    
    if (url.includes('/logout') && method === 'POST') {
      loggers.auth.logout(userId, ipAddress);
    }
    
    if (url.includes('/refresh') && method === 'POST') {
      loggers.auth.tokenRefresh(userId, ipAddress);
    }
  }
}

// Extract ID from URL path
function extractIdFromPath(pathSegments: string[], endpoint: string): string | null {
  const endpointIndex = pathSegments.findIndex(segment => segment === endpoint);
  
  if (endpointIndex !== -1 && endpointIndex + 1 < pathSegments.length) {
    const potentialId = pathSegments[endpointIndex + 1];
    
    if (!potentialId) return null;
    
    // Check if it's a valid ID (UUID or MongoDB ObjectId pattern)
    const isValidId = /^[a-f\d]{24}$/i.test(potentialId) || 
                     /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(potentialId);
    
    return isValidId ? potentialId : null;
  }
  
  return null;
}

// Middleware for logging suspicious activities
export const logSuspiciousActivity = (activity: string, details?: any) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?.id || null;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    loggers.security.suspiciousActivity(userId, activity, ipAddress, {
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ...details
    });
    
    next();
  };
};

// Middleware for logging unauthorized access attempts
export const logUnauthorizedAccess = (req: Request, res: Response, next: NextFunction): void => {
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  loggers.security.unauthorized(ipAddress, req.originalUrl, userAgent);
  
  next();
};
