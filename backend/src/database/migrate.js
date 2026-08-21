const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/db');
const logger = require('../utils/logger');

const runMigration = async () => {
  logger.info('Starting PostgreSQL schema migration...');

  const isConnected = await testConnection();
  if (!isConnected) {
    logger.error('Cannot run migration: Unable to connect to PostgreSQL database.');
    logger.error('Please verify your .env database credentials and that PostgreSQL is active.');
    process.exit(1);
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    logger.info('Executing DDL schema statements...');
    await pool.query(schemaSql);
    logger.info('✅ Database schema migration completed successfully!');
  } catch (err) {
    logger.error('Migration failed with error:', err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
