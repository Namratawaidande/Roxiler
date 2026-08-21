const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const storeRoutes = require('./store.routes');
const ratingRoutes = require('./rating.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

/**
 * Mount Resource Routers on /api/v1
 */
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/stores', storeRoutes);
router.use('/ratings', ratingRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
