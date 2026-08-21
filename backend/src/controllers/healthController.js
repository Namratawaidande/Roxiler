const db = require('../config/db');
const env = require('../config/env');
const { successResponse } = require('../utils/apiResponse');

/**
 * Health check handler
 * GET /api/v1/health
 */
const getHealth = async (req, res) => {
  const dbStatus = db.getStatus();
  const uptimeSeconds = process.uptime();

  const healthData = {
    status: 'ONLINE',
    service: 'Store Rating Platform API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptime: `${Math.floor(uptimeSeconds / 60)}m ${Math.floor(uptimeSeconds % 60)}s`,
    timestamp: new Date().toISOString(),
    database: {
      provider: 'PostgreSQL',
      configured: dbStatus.configured,
      connected: dbStatus.connected,
      host: dbStatus.host,
      port: dbStatus.port,
      database: dbStatus.database,
      lastError: dbStatus.lastError
    },
    rolesSupported: ['SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER']
  };

  return successResponse(res, healthData, 'API Server is healthy and operating normally.');
};

module.exports = {
  getHealth
};
