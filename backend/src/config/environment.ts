import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface ServerConfig {
  env: string;
  server: {
    port: number;
    host: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  abha: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
  };
  blockchain: {
    network: string;
    rpcUrl: string;
    privateKey: string;
    contractAddress: string;
    gasLimit: number;
    gasPrice: number;
    chainId: number;
  };
  security: {
    encryptionKey: string;
    encryptionAlgorithm: string;
    bcryptSaltRounds: number;
    auditLogEnabled: boolean;
    phiEncryptionEnabled: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  logging: {
    level: string;
    file: string;
    auditFile: string;
  };
}

const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export const config: ServerConfig = {
  env: process.env.NODE_ENV || 'development',
  
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost'
  },

  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    ssl: process.env.DB_SSL === 'true',
    url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET!,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  },

  abha: {
    baseUrl: process.env.ABHA_BASE_URL || 'https://healthidsbx.abdm.gov.in',
    clientId: process.env.ABHA_CLIENT_ID || '',
    clientSecret: process.env.ABHA_CLIENT_SECRET || '',
    scope: process.env.ABHA_SCOPE || 'abha-enrol'
  },

  blockchain: {
    network: process.env.BLOCKCHAIN_NETWORK || 'polygon-amoy',
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology/',
    privateKey: process.env.PRIVATE_KEY || '',
    contractAddress: process.env.CONTRACT_ADDRESS || '',
    gasLimit: parseInt(process.env.GAS_LIMIT || '500000', 10),
    gasPrice: parseInt(process.env.GAS_PRICE || '20000000000', 10), // 20 gwei default
    chainId: parseInt(process.env.CHAIN_ID || '80002', 10) // Polygon Amoy testnet
  },

  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    auditLogEnabled: process.env.AUDIT_LOG_ENABLED === 'true',
    phiEncryptionEnabled: process.env.PHI_ENCRYPTION_ENABLED === 'true'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,doc,docx,dicom').split(',')
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/cloudcare.log',
    auditFile: process.env.AUDIT_LOG_FILE || 'logs/audit.log'
  }
};

// Validate critical configurations in production
if (config.env === 'production') {
  const productionRequiredVars = [
    'ENCRYPTION_KEY',
    'ABHA_CLIENT_ID',
    'ABHA_CLIENT_SECRET'
  ];

  const missingProdVars = productionRequiredVars.filter(
    varName => !process.env[varName] || process.env[varName] === ''
  );

  if (missingProdVars.length > 0) {
    throw new Error(`Missing required production environment variables: ${missingProdVars.join(', ')}`);
  }

  // Ensure security settings are enabled in production
  if (!config.security.auditLogEnabled) {
    throw new Error('Audit logging must be enabled in production for HIPAA compliance');
  }

  if (!config.security.phiEncryptionEnabled) {
    throw new Error('PHI encryption must be enabled in production for HIPAA compliance');
  }
}
