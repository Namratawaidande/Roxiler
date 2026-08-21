const express = require('express');
const { getHealth } = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    API and Database Health Diagnostic Check
 * @access  Public
 */
router.get('/', getHealth);

module.exports = router;
