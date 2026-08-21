const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * Standard JSON API Response Envelope
 */
class ApiResponse {
  /**
   * Send a successful response (HTTP 200 by default)
   */
  static success(res, data = null, message = 'Operation completed successfully.', statusCode = HTTP_STATUS.OK, meta = null) {
    const payload = {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    if (meta) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Send a resource created response (HTTP 201)
   */
  static created(res, data = null, message = 'Resource created successfully.', meta = null) {
    return ApiResponse.success(res, data, message, HTTP_STATUS.CREATED, meta);
  }

  /**
   * Send an error response
   */
  static error(res, message = 'An unexpected error occurred.', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) {
    const payload = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString()
    };

    if (errors) {
      payload.errors = errors;
    }

    return res.status(statusCode).json(payload);
  }
}

// Retain standalone helpers for backwards compatibility
const successResponse = (res, data, message, statusCode, meta) => ApiResponse.success(res, data, message, statusCode, meta);
const errorResponse = (res, message, statusCode, errors) => ApiResponse.error(res, message, statusCode, errors);

module.exports = {
  ApiResponse,
  successResponse,
  errorResponse
};
