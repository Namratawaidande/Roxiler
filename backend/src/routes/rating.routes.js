const express = require('express');
const { submitRating } = require('../controllers/rating.controller');
const { createRatingValidator } = require('../validators/rating.validator');
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

module.exports = router;
