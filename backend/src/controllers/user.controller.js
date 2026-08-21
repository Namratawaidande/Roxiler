const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const userService = require('../services/user.service');

/**
 * Create User (Admin only)
 * POST /api/v1/users
 */
const createUser = asyncHandler(async (req, res) => {
  const result = await userService.createUser(req.body);
  return ApiResponse.created(res, { user: result }, 'User created successfully by Administrator.');
});

/**
 * Get Paginated Users List (Admin)
 * GET /api/v1/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getUsers(req.query);
  return ApiResponse.success(res, { users: result.users }, 'Users list retrieved successfully.', 200, result.meta);
});

/**
 * Get User by ID
 * GET /api/v1/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return ApiResponse.success(res, { user }, 'User details retrieved successfully.');
});

/**
 * Update User Details / Role
 * PATCH /api/v1/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUser(req.params.id, req.body);
  return ApiResponse.success(res, { user: updatedUser }, 'User updated successfully.');
});

/**
 * Delete User
 * DELETE /api/v1/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id);
  return ApiResponse.success(res, result, 'User deleted successfully.');
});

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
