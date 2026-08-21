const express = require('express');
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { createUserValidator, updateUserValidator, userQueryValidator, userIdParamValidator } = require('../validators/user.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Require authentication & SYSTEM_ADMIN authorization for all user management routes
router.use(authenticate);
router.use(authorize(ROLES.SYSTEM_ADMIN));

/**
 * @route   POST /api/v1/users
 * @desc    Create new user (NORMAL_USER, SYSTEM_ADMIN, STORE_OWNER)
 * @access  Private (SYSTEM_ADMIN only)
 */
router.post('/', validate(createUserValidator), createUser);

/**
 * @route   GET /api/v1/users
 * @desc    Get paginated users list with search, role/field filters & sorting
 * @access  Private (SYSTEM_ADMIN only)
 */
router.get('/', validate(userQueryValidator), getUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (SYSTEM_ADMIN only)
 */
router.get('/:id', validate(userIdParamValidator), getUserById);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user profile or role
 * @access  Private (SYSTEM_ADMIN only)
 */
router.patch('/:id', validate(userIdParamValidator.concat(updateUserValidator)), updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user account
 * @access  Private (SYSTEM_ADMIN only)
 */
router.delete('/:id', validate(userIdParamValidator), deleteUser);

module.exports = router;
