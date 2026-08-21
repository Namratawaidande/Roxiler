const express = require('express');
const { submitRating, updateRating } = require('../controllers/rating.controller');
const { createRatingValidator, updateRatingValidator, storeIdParamValidator } = require('../validators/rating.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

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
