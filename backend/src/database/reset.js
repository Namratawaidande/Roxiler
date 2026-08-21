const { pool, testConnection } = require('../config/db');
const runMigration = require('./migrate');
const runSeed = require('./seed');
const logger = require('../utils/logger');

const runReset = async () => {
  logger.info('⚠️ Starting development database reset...');

  const isConnected = await testConnection();
  if (!isConnected) {
    logger.error('Cannot reset database: PostgreSQL is offline or unreachable.');
    process.exit(1);
  }

  try {
    logger.info('Truncating tables and resetting identity sequences...');
    await pool.query(`
      DROP TABLE IF EXISTS ratings CASCADE;
      DROP TABLE IF EXISTS stores CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP VIEW IF EXISTS store_ratings_summary CASCADE;
    `);

    logger.info('Tables cleanly dropped. Re-applying schema migrations...');
    await runMigration();

    logger.info('Re-seeding initial development data...');
    await runSeed();

    logger.info('✅ Database reset and re-seeded successfully!');
  } catch (err) {
    logger.error('Database reset failed with error:', err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};

if (require.main === module) {
  runReset();
}

module.exports = runReset;
