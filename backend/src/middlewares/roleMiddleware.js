const { errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * Role Authorization Middleware
 * Usage: authorize(ROLES.SYSTEM_ADMIN) or authorize([ROLES.SYSTEM_ADMIN, ROLES.STORE_OWNER])
 */
const authorize = (...allowedRoles) => {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        'Authentication required before role authorization.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${roles.join(', ')}]`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

module.exports = {
  authorize
};
