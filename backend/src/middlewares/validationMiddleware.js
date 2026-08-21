const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * Express validator runner middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return errorResponse(
      res,
      'Validation failed for input fields.',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      extractedErrors
    );
  };
};

module.exports = {
  validate
};
