const express = require('express');
const { getAllStores, getStoreById, createStore } = require('../controllers/storeController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   GET /api/v1/stores
 * @desc    Get list of all stores
 * @access  Public
 */
router.get('/', getAllStores);

/**
 * @route   GET /api/v1/stores/:id
 * @desc    Get store by ID
 * @access  Public
 */
router.get('/:id', getStoreById);

/**
 * @route   POST /api/v1/stores
 * @desc    Create new store (Admin or Store Owner)
 * @access  Private (SYSTEM_ADMIN, STORE_OWNER)
 */
router.post('/', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.STORE_OWNER), createStore);

module.exports = router;
