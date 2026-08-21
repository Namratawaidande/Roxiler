const { UnauthorizedError, ForbiddenError } = require('../errors/ApiError');

/**
 * Reusable Role-Based Access Control (RBAC) Authorization Middleware
 *
 * Checks if the authenticated user has at least one of the specified allowed roles.
 *
 * @param {...string|Array<string>} allowedRoles - Whitelist of permitted role names
 * @returns {Function} Express middleware function
 *
 * @example
 * // Single role restriction
 * router.get('/admin', authenticate, authorize(ROLES.SYSTEM_ADMIN), getAdminData);
 *
 * // Multi-role restriction
 * router.post('/stores', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.STORE_OWNER), createStore);
 *
 * // Array argument syntax
 * router.post('/stores', authenticate, authorize([ROLES.SYSTEM_ADMIN, ROLES.STORE_OWNER]), createStore);
 */
const authorize = (...allowedRoles) => {
  // Flatten in case an array or spread arguments are passed
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    // 1. Must be authenticated first
    if (!req.user) {
      throw new UnauthorizedError('Authentication required before role authorization.');
    }

    // 2. Check if user's role is in the allowed whitelist
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Role '${req.user.role}' is not authorized to perform this operation. Required role(s): [${roles.join(', ')}]`
      );
    }

    next();
  };
};

module.exports = {
  authorize
};
