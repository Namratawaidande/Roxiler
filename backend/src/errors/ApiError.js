const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * Base Application API Error
 * Inherits from native Error and adds HTTP status codes & operational flags
 */
class ApiError extends Error {
  constructor(
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message = 'An unexpected internal server error occurred.',
    errors = null,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', errors = null) {
    super(HTTP_STATUS.BAD_REQUEST, message, errors);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required. Invalid or missing credentials.', errors = null) {
    super(HTTP_STATUS.UNAUTHORIZED, message, errors);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden. You do not have permission to access this resource.', errors = null) {
    super(HTTP_STATUS.FORBIDDEN, message, errors);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'The requested resource was not found.', errors = null) {
    super(HTTP_STATUS.NOT_FOUND, message, errors);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource conflict occurred. A record with these attributes already exists.', errors = null) {
    super(HTTP_STATUS.CONFLICT, message, errors);
  }
}

class ValidationError extends ApiError {
  constructor(message = 'Validation failed for request parameters.', errors = null) {
    super(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }
}

class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error', errors = null) {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errors);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError
};
