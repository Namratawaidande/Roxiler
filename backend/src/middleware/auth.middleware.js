const { verifyToken } = require('../utils/token');
const { UnauthorizedError } = require('../errors/ApiError');

/**
 * Authentication Middleware
 * Extracts and validates Bearer JWT token from Authorization header
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing. Please provide a Bearer token in the Authorization header.');
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
    throw new UnauthorizedError('Invalid authentication token signature.');
  }
};

/**
 * Optional Authentication Middleware
 * If token is present, verifies and attaches user, but doesn't block request if absent
 */
const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyToken(token);
    } catch {
      // Ignore invalid optional token
      req.user = null;
    }
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate
};
