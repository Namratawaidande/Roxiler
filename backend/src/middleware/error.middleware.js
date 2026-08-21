const logger = require('../utils/logger');
const { ApiResponse } = require('../utils/apiResponse');
const { ApiError, NotFoundError } = require('../errors/ApiError');
const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * 404 Route Catch-All Middleware
 */
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Resource not found: [${req.method}] ${req.originalUrl}`));
};

/**
 * Centralized Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // 1. Handle JSON parse syntax errors from body parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Malformed JSON payload in request body.';
  }

  // 2. Handle PostgreSQL specific error codes
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = HTTP_STATUS.CONFLICT;
        message = 'A record with these unique attributes already exists.';
        errors = err.detail ? [{ detail: err.detail }] : null;
        break;
      case '23503': // foreign_key_violation
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = 'Referenced entity does not exist.';
        errors = err.detail ? [{ detail: err.detail }] : null;
        break;
      case '23514': // check_violation
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = 'Database constraint check failed for submitted data.';
        break;
      case '22P02': // invalid_text_representation (e.g. string passed for integer ID)
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = 'Invalid parameter data type.';
        break;
      default:
        break;
    }
  }

  // 3. Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid authentication token signature.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Authentication token has expired. Please log in again.';
  }

  // Log error with context
  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, {
      message: err.message,
      stack: err.stack
    });
  } else {
    logger.debug(`[Client Error] [${statusCode}] ${req.method} ${req.originalUrl} - ${message}`);
  }

  // In development, attach stack trace to error payload
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    errors = errors || { stack: err.stack };
  }

  return ApiResponse.error(res, message, statusCode, errors);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
