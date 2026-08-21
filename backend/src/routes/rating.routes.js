const express = require('express');
const { submitRating, updateRating, getStoreOwnerRatings } = require('../controllers/rating.controller');
const { createRatingValidator, updateRatingValidator, storeIdParamValidator } = require('../validators/rating.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   GET /api/v1/ratings/owner
 * @desc    Get customer ratings for stores owned by authenticated STORE_OWNER
 * @access  Private (STORE_OWNER only)
 */
router.get(
  '/owner',
  authenticate,
  authorize(ROLES.STORE_OWNER),
  getStoreOwnerRatings
);

/**
 * @route   POST /api/v1/ratings
 * @desc    Submit a new store rating (1 to 5 stars)
 * @access  Private (NORMAL_USER only)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.NORMAL_USER),
  validate(createRatingValidator),
  submitRating
);

/**
 * @route   PUT /api/v1/ratings/:storeId
 * @desc    Modify an existing store rating
 * @access  Private (NORMAL_USER only)
 */
router.put(
  '/:storeId',
  authenticate,
  authorize(ROLES.NORMAL_USER),
  validate(storeIdParamValidator),
  validate(updateRatingValidator),
  updateRating
);

module.exports = router;
