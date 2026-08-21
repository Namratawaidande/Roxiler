const express = require('express');
const { getAdminDashboard, getStoreOwnerDashboard, getUserDashboard } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Require authentication for all dashboard views
router.use(authenticate);

/**
 * @route   GET /api/v1/dashboard/admin
 * @desc    Get administrative platform analytics
 * @access  Private (SYSTEM_ADMIN)
 */
router.get('/admin', authorize(ROLES.SYSTEM_ADMIN), getAdminDashboard);

/**
 * @route   GET /api/v1/dashboard/owner
 * @desc    Get store merchant analytics & customer feedback
 * @access  Private (STORE_OWNER)
 */
router.get('/owner', authorize(ROLES.STORE_OWNER), getStoreOwnerDashboard);

/**
 * @route   GET /api/v1/dashboard/user
 * @desc    Get customer rating history
 * @access  Private (NORMAL_USER)
 */
router.get('/user', authorize(ROLES.NORMAL_USER), getUserDashboard);

module.exports = router;
