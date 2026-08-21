const express = require('express');
const { register, login, getProfile, updatePassword, getRoles } = require('../controllers/auth.controller');
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
 * @desc    Authenticate user credentials & issue JWT token
 * @access  Public
 */
router.post('/login', authLimiter, validate(loginValidator), login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user profile
 * @access  Private (Authenticated)
 */
router.get('/me', authenticate, getProfile);

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Update user password
 * @access  Private (Authenticated)
 */
router.put('/password', authenticate, validate(updatePasswordValidator), updatePassword);

/**
 * @route   GET /api/v1/auth/roles
 * @desc    Get available system roles & capabilities
 * @access  Public
 */
router.get('/roles', getRoles);

module.exports = router;
