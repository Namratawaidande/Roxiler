const { verifyToken } = require('../utils/token');
const { errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * Authentication Middleware
 * Extracts Bearer token from Authorization header and verifies it
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        'Access denied. No authentication token provided.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Attach decoded user info (id, email, role) to the request object
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Authentication token has expired. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
    }
    return errorResponse(res, 'Invalid authentication token.', HTTP_STATUS.UNAUTHORIZED);
  }
};

module.exports = {
  authenticate
};
