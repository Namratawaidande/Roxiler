const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboard.service');

/**
 * Get Platform Analytics Dashboard (Admin)
 * GET /api/v1/dashboard/admin
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getAdminDashboard();
  return ApiResponse.success(res, data, 'Admin dashboard analytics retrieved successfully.');
});

/**
 * Get Store Owner Dashboard (Owner)
 * GET /api/v1/dashboard/owner
 */
const getStoreOwnerDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getStoreOwnerDashboard(req.user.id);
  return ApiResponse.success(res, data, 'Store owner dashboard retrieved successfully.');
});

/**
 * Get Normal User Dashboard (User)
 * GET /api/v1/dashboard/user
 */
const getUserDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getUserDashboard(req.user.id);
  return ApiResponse.success(res, data, 'User activity dashboard retrieved successfully.');
});

module.exports = {
  getAdminDashboard,
  getStoreOwnerDashboard,
  getUserDashboard
};
