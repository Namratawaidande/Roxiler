const express = require('express');
const { getPlatformStats, getAllUsers } = require('../controllers/adminController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Protect all admin routes: Requires SYSTEM_ADMIN role
router.use(authenticate, authorize(ROLES.SYSTEM_ADMIN));

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get system-wide platform statistics
 * @access  Private (SYSTEM_ADMIN)
 */
router.get('/stats', getPlatformStats);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get user accounts management list
 * @access  Private (SYSTEM_ADMIN)
 */
router.get('/users', getAllUsers);

module.exports = router;
