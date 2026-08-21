const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

let pool = null;
let isConnected = false;
let lastConnectionError = null;

let poolConfig = {
  max: env.DB.MAX_CONNECTIONS,
  idleTimeoutMillis: env.DB.IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DB.CONNECTION_TIMEOUT_MS
};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  if (env.DB.SSL || process.env.DATABASE_URL.includes('sslmode=require')) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  poolConfig.host = env.DB.HOST;
  poolConfig.port = env.DB.PORT;
  poolConfig.database = env.DB.NAME;
  poolConfig.user = env.DB.USER;
  poolConfig.password = env.DB.PASSWORD;
  poolConfig.ssl = env.DB.SSL ? { rejectUnauthorized: false } : false;
}

try {
  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle PostgreSQL client pool:', err.message);
    isConnected = false;
    lastConnectionError = err.message;
  });

  pool.on('connect', () => {
    logger.debug('New PostgreSQL client checked out from pool.');
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
    logger.info(`PostgreSQL Connected successfully to database: "${res.rows[0].database_name}" at ${res.rows[0].current_time}`);
    return true;
  };

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Connection timed out after ${env.DB.CONNECTION_TIMEOUT_MS}ms`)), env.DB.CONNECTION_TIMEOUT_MS);
  });

  try {
    return await Promise.race([connectPromise(), timeoutPromise]);
  } catch (err) {
    isConnected = false;
    lastConnectionError = err.message;
    logger.warn(`PostgreSQL connection check: ${err.message}. Backend ready in mock mode until database service starts.`);
    return false;
  }
};

/**
 * Execute a SQL query with performance timing and error handling
 */
const query = async (text, params) => {
  if (!pool) {
    throw new Error('Database connection pool is not available.');
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text: text.substring(0, 120), duration: `${duration}ms`, rowCount: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query execution error:', { query: text.substring(0, 120), error: error.message });
    throw error;
  }
};

/**
 * Checkout a client from the pool for manual transaction management
 */
const getClient = async () => {
  if (!pool) {
    throw new Error('Database connection pool is not available.');
  }
  return await pool.connect();
};

/**
 * Helper to run a callback inside a PostgreSQL atomic transaction
 *
 * @param {Function} callback - Async function receiving client
 * @returns {Promise<any>} Result of transaction callback
 *
 * @example
 * const result = await db.transaction(async (client) => {
 *   await client.query('INSERT INTO ...');
 *   await client.query('UPDATE ...');
 *   return { success: true };
 * });
 */
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back due to error:', err.message);
    throw err;
  } finally {
    client.release();
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
  maxConnections: env.DB.MAX_CONNECTIONS,
  lastError: lastConnectionError
});

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection,
  getStatus
};
