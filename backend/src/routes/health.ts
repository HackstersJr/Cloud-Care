import { Router, Request, Response } from 'express';
import { config } from '../config/environment';
import { database } from '../services/database';
import { blockchainService } from '../services/blockchainService';

const router = Router();

// Basic health check endpoint
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'CloudCare Healthcare Backend is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: '1.0.0'
  });
});

// Detailed health check with system information
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Get database health status
    const dbHealth = await database.healthCheck();
    
    // Get blockchain health status
    const blockchainConnected = await blockchainService.checkConnection();
    const blockchainStatus = blockchainService.getConnectionStatus();
    
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.env,
      version: '1.0.0',
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      services: {
        database: dbHealth.connected ? 'connected' : 'disconnected',
        blockchain: blockchainConnected ? 'connected' : 'disconnected',
        abha: 'available', // TODO: Add ABHA service connectivity check
      },
      database: {
        connected: dbHealth.connected,
        latency: dbHealth.latency,
        poolStats: dbHealth.poolStats,
        error: dbHealth.error
      },
      blockchain: {
        connected: blockchainStatus.connected,
        network: blockchainStatus.network,
        rpcUrl: blockchainStatus.rpcUrl,
        walletConnected: blockchainStatus.walletConnected,
        walletAddress: blockchainStatus.walletAddress
      },
      security: {
        auditLogging: config.security.auditLogEnabled,
        phiEncryption: config.security.phiEncryptionEnabled,
        httpsOnly: config.env === 'production'
      }
    };

    // If database is not connected, return 503 Service Unavailable
    const statusCode = dbHealth.connected ? 200 : 503;
    res.status(statusCode).json(healthData);
    
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness probe (for Kubernetes/Docker health checks)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    const dbHealth = await database.healthCheck();
    
    if (dbHealth.connected) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'healthy'
        }
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'unhealthy',
          error: dbHealth.error
        }
      });
    }
  } catch (error: any) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness probe (for Kubernetes/Docker health checks)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export default router;
