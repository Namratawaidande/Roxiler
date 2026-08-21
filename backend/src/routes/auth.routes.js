const express = require('express');
const { register, login, getProfile, logout, updatePassword, getRoles } = require('../controllers/auth.controller');
const { registerValidator, loginValidator, updatePasswordValidator } = require('../validators/auth.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', authLimiter, validate(registerValidator), register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Unified login for SYSTEM_ADMIN, STORE_OWNER, and NORMAL_USER
 * @access  Public
 */
router.post('/login', authLimiter, validate(loginValidator), login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user's safe profile
 * @access  Private (Authenticated)
 */
router.get('/me', authenticate, getProfile);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Log out current session
 * @access  Private (Authenticated)
 */
router.post('/logout', authenticate, logout);

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Update user password
 * @access  Private (Authenticated)
 */
router.put('/password', authenticate, validate(updatePasswordValidator), updatePassword);
router.put('/change-password', authenticate, validate(updatePasswordValidator), updatePassword);
router.post('/change-password', authenticate, validate(updatePasswordValidator), updatePassword);

/**
 * @route   GET /api/v1/auth/roles
 * @desc    Get available system roles & capabilities
 * @access  Public
 */
router.get('/roles', getRoles);

module.exports = router;
