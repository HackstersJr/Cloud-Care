import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config/environment';
import { loggers } from '../utils/logger';
import { MedicalRecord, Patient } from '../models/types';

interface QueryOptions {
  client?: PoolClient;
  timeout?: number;
}

interface TransactionOptions {
  timeout?: number;
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
}

export class DatabaseService {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection could not be established
      statement_timeout: 60000, // Timeout statements after 60 seconds
      query_timeout: 60000, // Timeout queries after 60 seconds
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client) => {
      loggers.database.connection('Client connected to database', { clientConnected: true });
    });

    this.pool.on('error', (err, client) => {
      loggers.database.error('Unexpected error on idle client', err);
    });

    this.pool.on('acquire', (client) => {
      loggers.database.debug('Client acquired from pool', { acquired: true });
    });

    this.pool.on('release', (client) => {
      loggers.database.debug('Client released back to pool', { released: true });
    });

    this.pool.on('remove', (client) => {
      loggers.database.connection('Client removed from pool', { removed: true });
    });
  }

  /**
   * Initialize database connection and verify connectivity
   */
  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      
      // Test the connection
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      
      client.release();
      
      this.isConnected = true;
      loggers.database.connection('Database connected successfully', {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0]
      });

    } catch (error: any) {
      this.isConnected = false;
      loggers.database.error('Failed to connect to database', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Execute a SQL query
   */
  async query<T extends QueryResultRow = any>(
    text: string, 
    params: any[] = [], 
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    let client: PoolClient | undefined;

    try {
      client = options.client || await this.pool.connect();
      
      loggers.database.query(text, params);
      
      const result = await client.query<T>(text, params);
      
      const duration = Date.now() - startTime;
      loggers.database.queryComplete(text, duration, result.rowCount || 0);
      
      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      loggers.database.queryError(text, error, duration);
      throw error;

    } finally {
      if (client && !options.client) {
        client.release();
      }
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      if (options.isolationLevel) {
        await client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
      }

      loggers.database.transaction('Transaction started', { isolationLevel: options.isolationLevel });
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      loggers.database.transaction('Transaction committed');
      
      return result;

    } catch (error: any) {
      await client.query('ROLLBACK');
      loggers.database.transaction('Transaction rolled back', { error: error.message });
      throw error;

    } finally {
      client.release();
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<{
    connected: boolean;
    latency?: number;
    poolStats?: {
      total: number;
      idle: number;
      waiting: number;
    };
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      await this.query('SELECT 1');
      const latency = Date.now() - startTime;

      return {
        connected: true,
        latency,
        poolStats: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount
        }
      };

    } catch (error: any) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Execute migrations
   */
  async runMigrations(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      loggers.database.migration('Migrations table ready');

    } catch (error: any) {
      loggers.database.error('Failed to setup migrations table', error);
      throw error;
    }
  }

  /**
   * Close all database connections
   */
  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      loggers.database.connection('Database disconnected');

    } catch (error: any) {
      loggers.database.error('Error during database disconnect', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get pool instance for advanced usage
   */
  get poolInstance(): Pool {
    return this.pool;
  }

  // Medical Records Methods

  /**
   * Create a new medical record
   */
  async createMedicalRecord(record: MedicalRecord): Promise<MedicalRecord> {
    const query = `
      INSERT INTO medical_records (
        id, patient_id, doctor_id, record_type, title, description,
        diagnosis, symptoms, medications, lab_results, imaging_results,
        notes, visit_date, follow_up_required, follow_up_date, severity,
        status, confidentiality_level, blockchain_hash, shareable_via_qr,
        qr_expires_at, created_at, updated_at, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *
    `;

    const values = [
      record.id,
      record.patientId,
      record.doctorId,
      record.recordType,
      record.title,
      record.description,
      JSON.stringify(record.diagnosis),
      JSON.stringify(record.symptoms),
      JSON.stringify(record.medications),
      JSON.stringify(record.labResults),
      JSON.stringify(record.imagingResults),
      record.notes,
      record.visitDate,
      record.followUpRequired,
      record.followUpDate,
      record.severity,
      record.status,
      record.confidentialityLevel,
      record.blockchainHash,
      record.shareableViaQR,
      record.qrExpiresAt,
      record.createdAt,
      record.updatedAt,
      record.isActive
    ];

    const result = await this.query(query, values);
    return this.mapRowToMedicalRecord(result.rows[0]);
  }

  /**
   * Get medical record by ID
   */
  async getMedicalRecord(id: string): Promise<MedicalRecord | null> {
    const query = 'SELECT * FROM medical_records WHERE id = $1 AND is_active = true';
    const result = await this.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToMedicalRecord(result.rows[0]);
  }

  /**
   * Update medical record
   */
  async updateMedicalRecord(id: string, record: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(record).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        const dbKey = this.camelToSnake(key);
        updateFields.push(`${dbKey} = $${paramCount}`);
        
        // JSON stringify arrays and objects
        if (Array.isArray(value) || (typeof value === 'object' && value !== null && !(value instanceof Date))) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE medical_records 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND is_active = true
      RETURNING *
    `;
    values.push(id);

    const result = await this.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Medical record not found or already deleted');
    }

    return this.mapRowToMedicalRecord(result.rows[0]);
  }

  /**
   * Get medical records by patient ID
   */
  async getMedicalRecordsByPatient(
    patientId: string,
    page: number = 1,
    limit: number = 20,
    filters: { recordType?: string; severity?: string; status?: string } = {}
  ): Promise<MedicalRecord[]> {
    let query = `
      SELECT * FROM medical_records 
      WHERE patient_id = $1 AND is_active = true
    `;
    const values = [patientId];
    let paramCount = 2;

    // Add filters
    if (filters.recordType) {
      query += ` AND record_type = $${paramCount}`;
      values.push(filters.recordType);
      paramCount++;
    }

    if (filters.severity) {
      query += ` AND severity = $${paramCount}`;
      values.push(filters.severity);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    // Add pagination
    query += ` ORDER BY visit_date DESC, created_at DESC`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit.toString(), ((page - 1) * limit).toString());

    const result = await this.query(query, values);
    return result.rows.map(row => this.mapRowToMedicalRecord(row));
  }

  /**
   * Check if healthcare provider has access to patient
   */
  async checkHealthcareProviderAccess(providerId: string, patientId: string): Promise<boolean> {
    // This would typically check if there's an active care relationship
    // For now, returning true for all healthcare providers
    // In production, implement proper access control based on:
    // - Active treatment relationships
    // - Hospital affiliations
    // - Patient consent
    const query = `
      SELECT COUNT(*) as count FROM medical_records 
      WHERE doctor_id = $1 AND patient_id = $2 AND is_active = true
    `;
    const result = await this.query(query, [providerId, patientId]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Get patient by user ID
   */
  async getPatientByUserId(userId: string): Promise<Patient | null> {
    const query = 'SELECT * FROM patients WHERE user_id = $1 AND is_active = true';
    const result = await this.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPatient(result.rows[0]);
  }

  /**
   * Helper method to map database row to MedicalRecord
   */
  private mapRowToMedicalRecord(row: any): MedicalRecord {
    return {
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id || undefined,
      recordType: row.record_type,
      title: row.title,
      description: row.description,
      diagnosis: row.diagnosis ? JSON.parse(row.diagnosis) : undefined,
      symptoms: row.symptoms ? JSON.parse(row.symptoms) : undefined,
      medications: row.medications ? JSON.parse(row.medications) : undefined,
      labResults: row.lab_results ? JSON.parse(row.lab_results) : undefined,
      imagingResults: row.imaging_results ? JSON.parse(row.imaging_results) : undefined,
      notes: row.notes,
      visitDate: new Date(row.visit_date),
      followUpRequired: row.follow_up_required,
      followUpDate: row.follow_up_date ? new Date(row.follow_up_date) : undefined,
      severity: row.severity || undefined,
      status: row.status,
      confidentialityLevel: row.confidentiality_level,
      blockchainHash: row.blockchain_hash || undefined,
      shareableViaQR: row.shareable_via_qr,
      qrExpiresAt: row.qr_expires_at ? new Date(row.qr_expires_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: row.is_active
    };
  }

  /**
   * Helper method to map database row to Patient
   */
  private mapRowToPatient(row: any): Patient {
    return {
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: new Date(row.date_of_birth),
      gender: row.gender,
      phoneNumber: row.phone_number,
      emergencyContact: JSON.parse(row.emergency_contact || '{}'),
      address: JSON.parse(row.address || '{}'),
      abhaId: row.abha_id,
      bloodType: row.blood_type,
      allergies: JSON.parse(row.allergies || '[]'),
      chronicConditions: JSON.parse(row.chronic_conditions || '[]'),
      insuranceInfo: row.insurance_info ? JSON.parse(row.insurance_info) : undefined,
      familyHistory: JSON.parse(row.family_history || '[]'),
      preferredLanguage: row.preferred_language,
      maritalStatus: row.marital_status,
      occupation: row.occupation,
      nextOfKin: row.next_of_kin ? JSON.parse(row.next_of_kin) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: row.is_active
    };
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

// Create singleton instance
export const database = new DatabaseService();

// Database connection wrapper for graceful startup
export async function connectDatabase(): Promise<void> {
  try {
    await database.connect();
    await database.runMigrations();
  } catch (error: any) {
    loggers.database.error('Database initialization failed', error);
    throw error;
  }
}

// Graceful shutdown helper
export async function disconnectDatabase(): Promise<void> {
  try {
    await database.disconnect();
  } catch (error: any) {
    loggers.database.error('Database shutdown failed', error);
  }
}
