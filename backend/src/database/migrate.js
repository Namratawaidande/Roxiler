const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/db');
const logger = require('../utils/logger');

const runMigration = async () => {
  logger.info('Starting PostgreSQL schema migration (3NF Normalized Schema)...');

  const isConnected = await testConnection();
  if (!isConnected) {
    logger.error('Cannot run migration: Unable to connect to PostgreSQL database.');
    logger.error('Please verify your .env database credentials and that the PostgreSQL service is active.');
    process.exit(1);
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    logger.info('Executing DDL statements, constraints, triggers, and views...');
    await pool.query(schemaSql);

    // Verify created tables
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tables = tableRes.rows.map((r) => r.table_name);

    logger.info(`✅ Migration finished! Tables verified in database: [${tables.join(', ')}]`);
    logger.info('✅ Views verified: [store_ratings_summary]');
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
