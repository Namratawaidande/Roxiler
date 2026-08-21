const { body, param, query } = require('express-validator');

/**
 * Validation rules for submitting a new store rating (POST /api/v1/ratings)
 */
const createRatingValidator = [
  body('rating')
    .optional({ checkFalsy: false })
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5.'),

  body('rating_value')
    .optional({ checkFalsy: false })
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5.'),

  body('storeId')
    .optional({ checkFalsy: false })
    .isInt({ min: 1 })
    .withMessage('Store ID must be a positive integer.'),

  body('store_id')
    .optional({ checkFalsy: false })
    .isInt({ min: 1 })
    .withMessage('Store ID must be a positive integer.'),

  body().custom((value) => {
    const hasStore = value.storeId !== undefined || value.store_id !== undefined;
    if (!hasStore) {
      throw new Error('storeId (or store_id) is required.');
    }
    const hasRating = value.rating !== undefined || value.rating_value !== undefined;
    if (!hasRating) {
      throw new Error('rating (or rating_value) is required and must be an integer between 1 and 5.');
    }
    return true;
  }),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 400 })
    .withMessage('Review comment cannot exceed 400 characters.')
];

/**
 * Validation rules for modifying an existing rating (PUT /api/v1/ratings/:id or PUT /api/v1/ratings/store/:storeId)
 */
const updateRatingValidator = [
  body('rating')
    .optional({ checkFalsy: false })
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5.'),

  body('rating_value')
    .optional({ checkFalsy: false })
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5.'),

  body().custom((value) => {
    const hasRating = value.rating !== undefined || value.rating_value !== undefined;
    if (!hasRating) {
      throw new Error('rating (or rating_value) is required and must be an integer between 1 and 5.');
    }
    return true;
  }),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 400 })
    .withMessage('Review comment cannot exceed 400 characters.')
];

module.exports = {
  createRatingValidator,
  updateRatingValidator
};
