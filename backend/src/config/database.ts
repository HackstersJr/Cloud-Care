import { Pool, PoolConfig } from 'pg';
import { config } from './environment';
import { logger } from '../utils/logger';

// Database connection pool configuration
const poolConfig: PoolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl,
  max: 20, // Maximum number of clients in the pool
  min: 5,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close a connection after it has been used 7500 times
};

// Create database connection pool
export const pool = new Pool(poolConfig);

// Database connection initialization
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test database connection
    const client = await pool.connect();
    
    logger.info('Database connection established successfully');
    logger.info(`Connected to database: ${config.database.name} at ${config.database.host}:${config.database.port}`);
    
    // Create necessary extensions if they don't exist
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    
    client.release();
    
    // Set up connection event listeners
    pool.on('connect', (client) => {
      logger.debug('New database client connected');
    });

    pool.on('acquire', (client) => {
      logger.debug('Client acquired from pool');
    });

    pool.on('remove', (client) => {
      logger.debug('Client removed from pool');
    });

    pool.on('error', (err, client) => {
      logger.error('Database pool error:', err);
    });

  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

// Graceful database shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool:', error);
    throw error;
  }
};

// Query helper with error handling and logging
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Database query executed', {
      query: text.substring(0, 100),
      duration,
      rows: result.rowCount
    });
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    
    logger.error('Database query failed', {
      query: text.substring(0, 100),
      duration,
      error: error.message,
      params: params ? 'present' : 'none'
    });
    
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback: (client: any) => Promise<any>): Promise<any> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Health check for database
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW() as current_time');
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

export default {
  pool,
  query,
  transaction,
  initializeDatabase,
  closeDatabase,
  checkDatabaseHealth
};
