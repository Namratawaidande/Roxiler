const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const healthService = require('../services/health.service');

/**
 * Health Check Controller
 * GET /api/v1/health
 */
const getHealth = asyncHandler(async (req, res) => {
  const diagnostics = await healthService.getSystemDiagnostics();
  return ApiResponse.success(res, diagnostics, 'API Server is healthy and operating normally.');
});

module.exports = {
  getHealth
};
