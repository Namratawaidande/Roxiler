const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const healthService = require('../services/health.service');
const { testConnection } = require('../config/db');

/**
 * Health Check Controller (Liveness Probe)
 * GET /api/v1/health
 */
const getHealth = asyncHandler(async (req, res) => {
  const diagnostics = await healthService.getSystemDiagnostics();
  return ApiResponse.success(res, diagnostics, 'API Server is healthy and operating normally.');
});

/**
 * Readiness Probe Controller (Checks DB Connection)
 * GET /api/v1/health/ready
 */
const getReady = asyncHandler(async (req, res) => {
  const isDbReady = await testConnection();
  if (!isDbReady) {
    return ApiResponse.error(res, 'Database dependency is unavailable.', 503, { database: 'disconnected' });
  }
  return ApiResponse.success(res, { ready: true, database: 'connected' }, 'Service is ready to receive traffic.');
});

module.exports = {
  getHealth,
  getReady
};
