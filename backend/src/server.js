const app = require('./app');
const env = require('./config/env');
const { testConnection, pool } = require('./config/db');
const logger = require('./utils/logger');

const startServer = () => {
  try {
    logger.info(`Initializing Store Rating Platform backend server in [${env.NODE_ENV}] mode...`);

    // Start HTTP Server immediately
    const server = app.listen(env.PORT, () => {
      logger.info('====================================================');
      logger.info(`🚀 Backend Server running at: http://localhost:${env.PORT}`);
      logger.info(`📡 Health Check URL:         http://localhost:${env.PORT}/api/v1/health`);
      logger.info(`🌐 Allowed Client Origin:    ${env.CLIENT_URL}`);
      logger.info(`🛡️  Auth Endpoints:          http://localhost:${env.PORT}/api/v1/auth`);
      logger.info('====================================================');

      // Test PostgreSQL database connectivity in background
      testConnection();
    });

    // Graceful Shutdown Handlers
    const handleShutdown = async (signal) => {
      logger.info(`Received ${signal}. Gracefully shutting down HTTP server...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        if (pool) {
          try {
            await pool.end();
            logger.info('PostgreSQL connection pool drained and closed.');
          } catch (dbErr) {
            logger.error('Error closing database pool:', dbErr.message);
          }
        }
        process.exit(0);
      });

      // Force close after 5s if stuck
      setTimeout(() => {
        logger.error('Forcing server shutdown due to timeout.');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error) {
    logger.error('Fatal error during backend server startup:', error.message);
    process.exit(1);
  }
};

startServer();
