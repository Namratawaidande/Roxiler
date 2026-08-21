const { body } = require('express-validator');

/**
 * Authentication Validators
 */
const registerValidator = [
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
    .isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters.')
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
];

const updatePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),

  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8, max: 16 }).withMessage('New password must be between 8 and 16 characters long.')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter.')
    .matches(/[!@#$%^&*(),.?":{}|<>_]/).withMessage('New password must contain at least one special character.'),

  body('confirmNewPassword')
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      if (value && value !== req.body.newPassword) {
        throw new Error('New password and confirm password do not match.');
      }
      return true;
    })
];

module.exports = {
  registerValidator,
  loginValidator,
  updatePasswordValidator
};
