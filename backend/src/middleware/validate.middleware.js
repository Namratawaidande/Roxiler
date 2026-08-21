const { validationResult } = require('express-validator');
const { ValidationError } = require('../errors/ApiError');

/**
 * Validation Middleware Runner
 * Executes an array of express-validator validation chains and forwards formatted errors
 *
 * @param {Array} validations - Array of express-validator ValidationChains
 * @returns {Function} Express middleware handler
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations in sequence
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
      location: err.location
    }));

    return next(new ValidationError('Request input validation failed. Please check the fields.', formattedErrors));
  };
};

module.exports = {
  validate
};
