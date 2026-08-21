const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

let pool = null;
let isConnected = false;
let lastConnectionError = null;

try {
  pool = new Pool({
    host: env.DB.HOST,
    port: env.DB.PORT,
    database: env.DB.NAME,
    user: env.DB.USER,
    password: env.DB.PASSWORD,
    ssl: env.DB.SSL ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle PostgreSQL client:', err.message);
    isConnected = false;
    lastConnectionError = err.message;
  });
} catch (err) {
  logger.error('Failed to initialize PostgreSQL pool:', err.message);
  lastConnectionError = err.message;
}

/**
 * Test PostgreSQL database connection with timeout guard
 */
const testConnection = async () => {
  if (!pool) {
    isConnected = false;
    lastConnectionError = 'PostgreSQL pool not initialized';
    return false;
  }

  const connectPromise = async () => {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as current_time, current_database() as database_name');
    client.release();
    isConnected = true;
    lastConnectionError = null;
    logger.info(`PostgreSQL Connected successfully to database: "${res.rows[0].database_name}"`);
    return true;
  };

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Connection timed out after 2000ms')), 2000);
  });

  try {
    return await Promise.race([connectPromise(), timeoutPromise]);
  } catch (err) {
    isConnected = false;
    lastConnectionError = err.message;
    logger.warn(`PostgreSQL connection check: ${err.message}. Ready when database starts.`);
    return false;
  }
};

/**
 * Execute a SQL query using the connection pool
 */
const query = async (text, params) => {
  if (!pool) {
    throw new Error('Database connection pool is not available.');
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text: text.substring(0, 100), duration: `${duration}ms`, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error:', { query: text.substring(0, 100), error: error.message });
    throw error;
  }
};

/**
 * Get current database status summary
 */
const getStatus = () => ({
  configured: Boolean(pool),
  connected: isConnected,
  host: env.DB.HOST,
  port: env.DB.PORT,
  database: env.DB.NAME,
  user: env.DB.USER,
  lastError: lastConnectionError
});

module.exports = {
  pool,
  query,
  testConnection,
  getStatus
};
