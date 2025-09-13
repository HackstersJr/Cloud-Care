import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Singleton Prisma client instance
class PrismaService {
  private static instance: PrismaService;
  private client: PrismaClient;

  private constructor() {
    this.client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public getClient(): PrismaClient {
    return this.client;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.$connect();
      logger.info('✅ Prisma connected successfully', {
        timestamp: new Date().toISOString(),
        type: 'database_connection'
      });
    } catch (error) {
      logger.error('❌ Failed to connect to database with Prisma', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'database_connection_error'
      });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.$disconnect();
      logger.info('Prisma disconnected successfully', {
        timestamp: new Date().toISOString(),
        type: 'database_disconnection'
      });
    } catch (error) {
      logger.error('Failed to disconnect from database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'database_disconnection_error'
      });
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'database_health_check_error'
      });
      return false;
    }
  }
}

// Export singleton instance
export const prismaService = PrismaService.getInstance();
export const prisma = prismaService.getClient();
export default prismaService;
