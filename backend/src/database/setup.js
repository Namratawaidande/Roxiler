const runMigration = require('./migrate');
const runSeed = require('./seed');
const logger = require('../utils/logger');

const runSetup = async () => {
  try {
    logger.info('🚀 Starting complete database setup (Migration + Seeding)...');
    await runMigration();
    await runSeed();
    logger.info('✅ Database setup completed successfully!');
  } catch (err) {
    logger.error('Database setup failed:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  runSetup();
}

module.exports = runSetup;
