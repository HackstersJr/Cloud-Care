import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// HIPAA-compliant audit log format
const auditFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, userId, action, resource, ipAddress, userAgent, ...meta }) => {
    const auditEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      userId: userId || 'anonymous',
      action: action || 'unknown',
      resource: resource || 'unknown',
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      metadata: meta
    };
    
    return JSON.stringify(auditEntry);
  })
);

// Main application logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'cloudcare.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Error-only file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// HIPAA-compliant audit logger
export const auditLogger = winston.createLogger({
  level: 'info',
  format: auditFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    })
  ]
});

// Structured logging helpers
export const loggers = {
  // Authentication events
  auth: {
    login: (userId: string, ipAddress: string, success: boolean) => {
      auditLogger.info('User authentication attempt', {
        userId,
        action: 'login',
        resource: 'auth',
        ipAddress,
        success,
        timestamp: new Date().toISOString()
      });
    },
    
    logout: (userId: string, ipAddress: string) => {
      auditLogger.info('User logout', {
        userId,
        action: 'logout',
        resource: 'auth',
        ipAddress,
        timestamp: new Date().toISOString()
      });
    },
    
    tokenRefresh: (userId: string, ipAddress: string) => {
      auditLogger.info('Token refresh', {
        userId,
        action: 'token_refresh',
        resource: 'auth',
        ipAddress,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Medical record access
  medicalRecord: {
    access: (userId: string, recordId: string, patientId: string, ipAddress: string) => {
      auditLogger.info('Medical record accessed', {
        userId,
        action: 'access',
        resource: 'medical_record',
        recordId,
        patientId,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    },
    
    create: (userId: string, recordId: string, patientId: string, ipAddress: string) => {
      auditLogger.info('Medical record created', {
        userId,
        action: 'create',
        resource: 'medical_record',
        recordId,
        patientId,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    },
    
    update: (userId: string, recordId: string, patientId: string, changes: string[], ipAddress: string) => {
      auditLogger.info('Medical record updated', {
        userId,
        action: 'update',
        resource: 'medical_record',
        recordId,
        patientId,
        changes,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    },
    
    delete: (userId: string, recordId: string, patientId: string, ipAddress: string) => {
      auditLogger.info('Medical record deleted', {
        userId,
        action: 'delete',
        resource: 'medical_record',
        recordId,
        patientId,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Patient data access
  patient: {
    access: (userId: string, patientId: string, ipAddress: string) => {
      auditLogger.info('Patient data accessed', {
        userId,
        action: 'access',
        resource: 'patient',
        patientId,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    },
    
    update: (userId: string, patientId: string, changes: string[], ipAddress: string) => {
      auditLogger.info('Patient data updated', {
        userId,
        action: 'update',
        resource: 'patient',
        patientId,
        changes,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    }
  },

  // QR code generation and sharing
  qr: {
    generate: (userId: string, recordId: string, patientId: string, ipAddress: string) => {
      auditLogger.info('QR code generated for medical record sharing', {
        userId,
        action: 'qr_generate',
        resource: 'medical_record_share',
        recordId,
        patientId,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    },
    
    access: (recordId: string, patientId: string, ipAddress: string, qrToken: string) => {
      auditLogger.info('Medical record accessed via QR code', {
        action: 'qr_access',
        resource: 'medical_record_share',
        recordId,
        patientId,
        qrToken,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Security events
  security: {
    suspiciousActivity: (userId: string | null, activity: string, ipAddress: string, details?: any) => {
      auditLogger.warn('Suspicious activity detected', {
        userId: userId || 'anonymous',
        action: 'suspicious_activity',
        resource: 'security',
        activity,
        ipAddress,
        details,
        timestamp: new Date().toISOString()
      });
    },
    
    rateLimitExceeded: (ipAddress: string, endpoint: string) => {
      auditLogger.warn('Rate limit exceeded', {
        action: 'rate_limit_exceeded',
        resource: 'security',
        endpoint,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    },
    
    unauthorized: (ipAddress: string, endpoint: string, userAgent?: string) => {
      auditLogger.warn('Unauthorized access attempt', {
        action: 'unauthorized_access',
        resource: 'security',
        endpoint,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Database operations
  database: {
    connection: (message: string, metadata?: any) => {
      logger.info(`Database: ${message}`, {
        type: 'database_connection',
        ...metadata,
        timestamp: new Date().toISOString()
      });
    },

    query: (text: string, params: any[]) => {
      logger.debug('Database query', {
        type: 'database_query',
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        paramCount: params.length,
        timestamp: new Date().toISOString()
      });
    },

    queryComplete: (text: string, duration: number, rowCount: number) => {
      logger.debug('Database query completed', {
        type: 'database_query_complete',
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        rowCount,
        timestamp: new Date().toISOString()
      });
    },

    queryError: (text: string, error: any, duration: number) => {
      logger.error('Database query error', {
        type: 'database_query_error',
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      });
    },

    transaction: (message: string, metadata?: any) => {
      logger.debug(`Database transaction: ${message}`, {
        type: 'database_transaction',
        ...metadata,
        timestamp: new Date().toISOString()
      });
    },

    migration: (message: string, metadata?: any) => {
      logger.info(`Database migration: ${message}`, {
        type: 'database_migration',
        ...metadata,
        timestamp: new Date().toISOString()
      });
    },

    error: (message: string, error: any) => {
      logger.error(`Database error: ${message}`, {
        type: 'database_error',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    },

    debug: (message: string, metadata?: any) => {
      logger.debug(`Database: ${message}`, {
        type: 'database_debug',
        ...metadata,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Performance monitoring
export const performanceLogger = {
  logDatabaseQuery: (query: string, duration: number, userId?: string) => {
    logger.info('Database query executed', {
      type: 'database_query',
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  logAPIResponse: (method: string, url: string, statusCode: number, duration: number, userId?: string) => {
    logger.info('API request completed', {
      type: 'api_response',
      method,
      url,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString()
    });
  }
};

// Environment-specific configuration
if (process.env.NODE_ENV === 'production') {
  // In production, reduce console logging
  const consoleTransport = logger.transports[0];
  if (consoleTransport) {
    logger.remove(consoleTransport); // Remove console transport
  }
} else if (process.env.NODE_ENV === 'test') {
  // In test environment, suppress most logging
  logger.level = 'error';
  auditLogger.level = 'error';
}
