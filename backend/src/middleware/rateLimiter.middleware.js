const { ApiResponse } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * In-memory sliding window rate limiter
 * Protects endpoints from abuse and brute-force attacks
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.max - Maximum requests per IP in the window (default: 100)
 * @param {string} options.message - Error message when rate limit is exceeded
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests from this IP. Please try again later.'
} = {}) => {
  const ipRequests = new Map();

  // Periodic cleanup of stale IP records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequests.entries()) {
      if (now - record.startTime > windowMs) {
        ipRequests.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = ipRequests.get(ip);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      ipRequests.set(ip, record);
    } else {
      record.count += 1;
    }

    // Set standard rate limit headers
    const remaining = Math.max(0, max - record.count);
    const resetTime = Math.ceil((record.startTime + windowMs - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (record.count > max) {
      return ApiResponse.error(res, message, HTTP_STATUS.TOO_MANY_REQUESTS || 429, {
        retryAfterSeconds: resetTime
      });
    }

    next();
  };
};

// Preset limiters for different sensitivity levels
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300,
  message: 'API rate limit exceeded. Please slow down your requests.'
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30,
  message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter
};
