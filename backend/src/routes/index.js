const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const storeRoutes = require('./storeRoutes');
const ratingRoutes = require('./ratingRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

/**
 * Route Index
 */
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/ratings', ratingRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
