const express = require('express');
const { getHealth, getReady } = require('../controllers/health.controller');

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    Liveness probe: API process diagnostics
 * @access  Public
 */
router.get('/', getHealth);

/**
 * @route   GET /api/v1/health/ready
 * @desc    Readiness probe: Database connectivity verification
 * @access  Public
 */
router.get('/ready', getReady);

module.exports = router;
