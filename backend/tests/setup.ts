import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'cloudcare_test_db';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test setup
beforeAll(async () => {
  // Database setup for tests can go here
});

afterAll(async () => {
  // Database cleanup for tests can go here
});

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'test_password';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Faster for tests
