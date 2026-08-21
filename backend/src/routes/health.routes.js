const express = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    API and database diagnostics
 * @access  Public
 */
router.get('/', getHealth);

module.exports = router;
