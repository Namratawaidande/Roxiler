const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validate and sanitize environment configuration variables
 */
const validateEnv = () => {
  const warnings = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    warnings.push('JWT_SECRET is either not set or shorter than 16 characters. A secure 32+ char key is recommended in production.');
  }

  if (!process.env.DB_NAME) {
    warnings.push('DB_NAME is not set in environment. Defaulting to "store_rating_db".');
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    warnings.forEach((w) => console.warn(`⚠️  [ENV CONFIG WARN] ${w}`));
  }
};

validateEnv();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // PostgreSQL Database Configuration
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || '5432', 10),
    NAME: process.env.DB_NAME || 'store_rating_db',
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || 'postgres',
    SSL: process.env.DB_SSL === 'true',
    MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    IDLE_TIMEOUT_MS: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
    CONNECTION_TIMEOUT_MS: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000', 10)
  },

  // JWT Authentication Configuration
  JWT: {
    SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_store_rating_platform_2026',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d'
  },

  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
};

module.exports = env;
