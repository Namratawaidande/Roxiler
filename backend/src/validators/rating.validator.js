const { body, query, param } = require('express-validator');

/**
 * Rating Module Validators
 */
const submitRatingValidator = [
  body('storeId')
    .notEmpty().withMessage('Store ID is required.')
    .isInt({ min: 1 }).withMessage('Store ID must be a positive integer.'),

  body('rating')
    .notEmpty().withMessage('Rating score is required.')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5 stars.'),

  body('comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters.')
];

const updateRatingValidator = [
  body('rating')
    .notEmpty().withMessage('Rating score is required.')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5 stars.'),

  body('comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters.')
];

const storeRatingsQueryValidator = [
  param('storeId').isInt({ min: 1 }).withMessage('Store ID must be a positive integer.'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('sortBy').optional().isIn(['rating', 'created_at']).withMessage('Invalid sortBy field.'),
  query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage('Order must be ASC or DESC.')
];

module.exports = {
  submitRatingValidator,
  updateRatingValidator,
  storeRatingsQueryValidator
};
