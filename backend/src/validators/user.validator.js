const { body, query, param } = require('express-validator');
const { ROLES } = require('../constants/roles');

/**
 * User Module Validators
 */
const createUserValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 20, max: 60 }).withMessage('Name must be between 20 and 60 characters long.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8, max: 16 }).withMessage('Password must be between 8 and 16 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[!@#$%^&*(),.?":{}|<>_]/).withMessage('Password must contain at least one special character.'),

  body('address')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters.'),

  body('role')
    .notEmpty().withMessage('Role is required.')
    .isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`)
];

const updateUserValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 20, max: 60 }).withMessage('Name must be between 20 and 60 characters long.'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters.'),

  body('role')
    .optional()
    .isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`)
];

const userQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('sortBy').optional().isIn(['id', 'name', 'email', 'address', 'role', 'created_at']).withMessage('Invalid sortBy field. Supported: id, name, email, address, role, created_at.'),
  query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage('Order must be ASC or DESC.'),
  query('role').optional().isIn(Object.values(ROLES)).withMessage(`Role filter must be one of: ${Object.values(ROLES).join(', ')}`),
  query('search').optional().trim(),
  query('name').optional().trim(),
  query('email').optional().trim(),
  query('address').optional().trim()
];

const userIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer.')
];

module.exports = {
  createUserValidator,
  updateUserValidator,
  userQueryValidator,
  userIdParamValidator
};
