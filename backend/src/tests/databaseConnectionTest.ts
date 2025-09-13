/**
 * Simple database connection test to debug authentication issues
 */

import { config } from '../config/environment';
import { Pool } from 'pg';

async function testDatabaseConnection() {
  console.log('🔍 Database Connection Test\n');

  // Display configuration being used
  console.log('📋 Database Configuration:');
  console.log(`Host: ${config.database.host}`);
  console.log(`Port: ${config.database.port}`);
  console.log(`Database: ${config.database.name}`);
  console.log(`User: ${config.database.user}`);
  console.log(`Password: ${config.database.password.substring(0, 3)}***`);
  console.log(`SSL: ${config.database.ssl}`);
  console.log(`URL: ${config.database.url.replace(/:([^:@]*@)/, ':***@')}\n`);

  // Test with explicit configuration
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔌 Attempting database connection...');
    const client = await pool.connect();
    
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('⏰ Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // Test QR tables exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('qr_share_tokens', 'users', 'medical_records')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Available tables:');
    tableCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    client.release();
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:');
    console.error(`  Code: ${error.code}`);
    console.error(`  Severity: ${error.severity}`);
    console.error(`  Detail: ${error.detail || 'N/A'}`);
    
    if (error.code === '28P01') {
      console.error('\n💡 Authentication failure suggestions:');
      console.error('  1. Check if the database password is correct');
      console.error('  2. Verify the database user exists');
      console.error('  3. Check if the database is running');
      console.error('  4. Verify PostgreSQL authentication configuration');
    }
  } finally {
    await pool.end();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection().catch(console.error);
}

export { testDatabaseConnection };
