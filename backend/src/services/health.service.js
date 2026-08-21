const db = require('../config/db');
const env = require('../config/env');
const { ROLES } = require('../constants/roles');

/**
 * Health & Diagnostics Business Service
 */
class HealthService {
  /**
   * Aggregate system health, database status, and uptime metrics
   */
  async getSystemDiagnostics() {
    const dbStatus = db.getStatus();
    const uptimeSeconds = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      status: 'ONLINE',
      service: 'Store Rating Platform API',
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptime: `${Math.floor(uptimeSeconds / 60)}m ${Math.floor(uptimeSeconds % 60)}s`,
      timestamp: new Date().toISOString(),
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024)
      },
      database: {
        provider: 'PostgreSQL',
        configured: dbStatus.configured,
        connected: dbStatus.connected,
        host: dbStatus.host,
        port: dbStatus.port,
        database: dbStatus.database,
        lastError: dbStatus.lastError
      },
      rolesSupported: Object.values(ROLES)
    };
  }
}

module.exports = new HealthService();
