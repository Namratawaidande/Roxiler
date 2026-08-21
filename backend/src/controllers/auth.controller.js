const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

/**
 * Register User
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return ApiResponse.created(res, result, 'User registered successfully.');
});

/**
 * Unified Login for all roles (SYSTEM_ADMIN, STORE_OWNER, NORMAL_USER)
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return ApiResponse.success(res, result, 'Login successful.');
});

/**
 * Get Current Authenticated User Profile
 * GET /api/v1/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return ApiResponse.success(res, { user }, 'Current user profile retrieved successfully.');
});

/**
 * Logout Endpoint
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user);
  return ApiResponse.success(res, result, 'Logged out successfully.');
});

/**
 * Update Current User Password
 * PUT /api/v1/auth/password
 */
const updatePassword = asyncHandler(async (req, res) => {
  const result = await authService.updatePassword(req.user.id, req.body);
  return ApiResponse.success(res, result, 'Password updated successfully.');
});

/**
 * Get Supported Roles & Descriptions
 * GET /api/v1/auth/roles
 */
const getRoles = asyncHandler(async (req, res) => {
  const roles = authService.getRoles();
  return ApiResponse.success(res, { roles }, 'System roles retrieved successfully.');
});

module.exports = {
  register,
  login,
  getProfile,
  logout,
  updatePassword,
  getRoles
};
