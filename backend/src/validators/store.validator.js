const { body, query, param } = require('express-validator');

/**
 * Store Module Validators
 */
const createStoreValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Store name is required.')
    .isLength({ min: 20, max: 60 }).withMessage('Store name must be between 20 and 60 characters long.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Store contact email is required.')
    .isEmail().withMessage('Please provide a valid store email address.')
    .normalizeEmail(),

  body('address')
    .trim()
    .notEmpty().withMessage('Store address is required.')
    .isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters.'),

  body('owner_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Owner ID must be a valid positive integer.'),

  body('ownerId')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Owner ID must be a valid positive integer.')
];

const updateStoreValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 20, max: 60 }).withMessage('Store name must be between 20 and 60 characters long.'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters.'),

  body('owner_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Owner ID must be a valid positive integer.'),

  body('ownerId')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Owner ID must be a valid positive integer.')
];

const storeQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('sortBy').optional().isIn(['id', 'name', 'email', 'address', 'rating', 'averageRating', 'ratingCount', 'myRating', 'created_at']).withMessage('Invalid sortBy field. Supported: id, name, email, address, rating, averageRating, ratingCount, myRating, created_at.'),
  query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage('Order must be ASC or DESC.'),
  query('search').optional().trim(),
  query('name').optional().trim(),
  query('email').optional().trim(),
  query('address').optional().trim(),
  query('minRating').optional().isFloat({ min: 1, max: 5 }).withMessage('minRating must be between 1.0 and 5.0.'),
  query('maxRating').optional().isFloat({ min: 1, max: 5 }).withMessage('maxRating must be between 1.0 and 5.0.')
];

const storeIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Store ID must be a positive integer.')
];

module.exports = {
  createStoreValidator,
  updateStoreValidator,
  storeQueryValidator,
  storeIdParamValidator
};
