const express = require('express');
const { getStores, getStoreById, createStore, updateStore, deleteStore } = require('../controllers/store.controller');
const { createStoreValidator, updateStoreValidator, storeQueryValidator, storeIdParamValidator } = require('../validators/store.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   GET /api/v1/stores
 * @desc    Get stores list with search, filter, sort & pagination, including authenticated user's submitted rating
 * @access  Private (Authenticated users)
 */
router.get('/', authenticate, validate(storeQueryValidator), getStores);

/**
 * @route   GET /api/v1/stores/:id
 * @desc    Get single store by ID with average rating
 * @access  Private (Authenticated users)
 */
router.get('/:id', authenticate, validate(storeIdParamValidator), getStoreById);

/**
 * @route   POST /api/v1/stores
 * @desc    Create new store
 * @access  Private (SYSTEM_ADMIN, STORE_OWNER)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.SYSTEM_ADMIN, ROLES.STORE_OWNER),
  validate(createStoreValidator),
  createStore
);

/**
 * @route   PUT /api/v1/stores/:id
 * @desc    Update store details
 * @access  Private (SYSTEM_ADMIN, Store Owner)
 */
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.SYSTEM_ADMIN, ROLES.STORE_OWNER),
  validate(storeIdParamValidator.concat(updateStoreValidator)),
  updateStore
);

/**
 * @route   DELETE /api/v1/stores/:id
 * @desc    Delete store
 * @access  Private (SYSTEM_ADMIN, Store Owner)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.SYSTEM_ADMIN, ROLES.STORE_OWNER),
  validate(storeIdParamValidator),
  deleteStore
);

module.exports = router;
