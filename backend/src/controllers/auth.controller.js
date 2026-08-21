const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants/httpStatus');
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
 * Login User
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return ApiResponse.success(res, result, 'Login successful.');
});

/**
 * Get Current User Profile
 * GET /api/v1/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { user: req.user }, 'User profile retrieved successfully.');
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
  updatePassword,
  getRoles
};
