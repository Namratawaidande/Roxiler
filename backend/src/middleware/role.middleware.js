const { UnauthorizedError, ForbiddenError } = require('../errors/ApiError');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if the authenticated user possesses at least one of the permitted roles
 *
 * @param  {...string|Array<string>} allowedRoles - Whitelist of permitted role names
 * @returns {Function} Express middleware handler
 *
 * @example
 * router.get('/admin/stats', authenticate, authorize(ROLES.SYSTEM_ADMIN), getStats);
 * router.post('/stores', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.STORE_OWNER), createStore);
 */
const authorize = (...allowedRoles) => {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required prior to role authorization.');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Role '${req.user.role}' is not authorized to perform this operation. Allowed role(s): [${roles.join(', ')}]`
      );
    }

    next();
  };
};

module.exports = {
  authorize
};
