const express = require('express');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { createUserValidator, updateUserValidator, userQueryValidator, userIdParamValidator } = require('../validators/user.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Require authentication for all user management routes
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    Get paginated users list (search, role filter, sort)
 * @access  Private (SYSTEM_ADMIN only)
 */
router.get('/', authorize(ROLES.SYSTEM_ADMIN), validate(userQueryValidator), getUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (SYSTEM_ADMIN only)
 */
router.get('/:id', authorize(ROLES.SYSTEM_ADMIN), validate(userIdParamValidator), getUserById);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user profile or role
 * @access  Private (SYSTEM_ADMIN only)
 */
router.patch('/:id', authorize(ROLES.SYSTEM_ADMIN), validate(userIdParamValidator.concat(updateUserValidator)), updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user account
 * @access  Private (SYSTEM_ADMIN only)
 */
router.delete('/:id', authorize(ROLES.SYSTEM_ADMIN), validate(userIdParamValidator), deleteUser);

module.exports = router;
