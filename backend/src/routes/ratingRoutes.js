const express = require('express');
const { getStoreRatings, submitRating } = require('../controllers/ratingController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   GET /api/v1/ratings/store/:storeId
 * @desc    Get all ratings for a given store
 * @access  Public
 */
router.get('/store/:storeId', getStoreRatings);

/**
 * @route   POST /api/v1/ratings
 * @desc    Submit or update store rating
 * @access  Private (NORMAL_USER)
 */
router.post('/', authenticate, authorize(ROLES.NORMAL_USER), submitRating);

module.exports = router;
