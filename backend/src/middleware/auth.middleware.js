const { verifyToken } = require('../utils/token');
const { UnauthorizedError } = require('../errors/ApiError');

/**
 * Authentication Middleware
 * Extracts and validates Bearer JWT token from Authorization header.
 * Throws 401 Unauthorized if missing, expired, or malformed.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing. Please include a valid Bearer token in the Authorization header.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Authentication token has expired. Please log in again.');
    }
    throw new UnauthorizedError('Invalid authentication token signature or malformed token.');
  }
};

/**
 * Optional Authentication Middleware
 * If token is present, verifies and attaches req.user; does not block if absent.
 */
const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate
};
