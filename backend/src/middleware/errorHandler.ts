import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export class AppError extends Error implements CustomError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common HTTP error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class HIPAAComplianceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, 'HIPAA_COMPLIANCE_VIOLATION', details);
  }
}

// HIPAA-specific errors
export class PHIAccessError extends AppError {
  constructor(message: string = 'Unauthorized access to Protected Health Information') {
    super(message, 403, 'PHI_ACCESS_DENIED');
  }
}

export class DataRetentionError extends AppError {
  constructor(message: string = 'Data retention policy violation') {
    super(message, 422, 'DATA_RETENTION_VIOLATION');
  }
}

// Development vs Production error responses
const sendErrorDev = (err: CustomError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    error: {
      status: 'error',
      statusCode: err.statusCode || 500,
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      stack: err.stack,
      details: err.details,
      timestamp: new Date().toISOString()
    }
  });
};

const sendErrorProd = (err: CustomError, res: Response): void => {
  // Operational, trusted errors: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      error: {
        status: 'error',
        statusCode: err.statusCode || 500,
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString()
      }
    });
  } else {
    // Programming or other unknown errors: don't leak error details
    res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Our team has been notified.',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Handle specific error types
const handleJWTError = (): AppError => 
  new UnauthorizedError('Invalid token. Please log in again.');

const handleJWTExpiredError = (): AppError =>
  new UnauthorizedError('Your token has expired. Please log in again.');

const handleCastErrorDB = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new ConflictError(message);
};

const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ValidationError(message, errors);
};

// Rate limiting error handler
const handleRateLimitError = (req: Request): AppError => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method
  });
  
  return new AppError(
    'Too many requests from this IP, please try again later.',
    429,
    'RATE_LIMIT_EXCEEDED'
  );
};

// Main error handling middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error for monitoring
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err.type === 'RateLimitError') error = handleRateLimitError(req);

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
  next(err);
};

// Async error wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled error handlers
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (err: any) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', {
    error: err.message || err,
    stack: err.stack
  });
  process.exit(1);
});
