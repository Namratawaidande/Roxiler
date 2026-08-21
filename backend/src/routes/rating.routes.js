const express = require('express');
const { submitRating, getStoreRatings, getMyRatingForStore } = require('../controllers/rating.controller');
const { submitRatingValidator, storeRatingsQueryValidator } = require('../validators/rating.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   GET /api/v1/ratings/store/:storeId
 * @desc    Get all reviews and ratings for a store
 * @access  Public
 */
router.get('/store/:storeId', validate(storeRatingsQueryValidator), getStoreRatings);

/**
 * @route   GET /api/v1/ratings/store/:storeId/my-rating
 * @desc    Get current user's submitted rating for a store
 * @access  Private (NORMAL_USER)
 */
router.get('/store/:storeId/my-rating', authenticate, authorize(ROLES.NORMAL_USER), getMyRatingForStore);

/**
 * @route   POST /api/v1/ratings
 * @desc    Submit or update 1-5 star store rating
 * @access  Private (NORMAL_USER)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.NORMAL_USER),
  validate(submitRatingValidator),
  submitRating
);

module.exports = router;
