/**
 * Higher-order async handler wrapper for Express route controllers
 * Eliminates repetitive try-catch blocks and automatically forwards errors to next()
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
