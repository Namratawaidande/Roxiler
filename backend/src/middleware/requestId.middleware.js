const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Request Correlation ID & Performance Timing Middleware
 * Generates or extracts X-Request-Id header and tracks response latency
 */
const requestIdMiddleware = (req, res, next) => {
  // 1. Assign or propagate correlation ID
  const correlationId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = correlationId;
  res.setHeader('X-Request-Id', correlationId);

  // 2. Track execution time
  const startHrTime = process.hrtime();

  // Intercept writeHead to set timing header before headers are flushed
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${elapsedTimeInMs}ms`);
    }
    return originalWriteHead.apply(this, args);
  };

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);

    // Log slow requests (> 500ms) as warnings
    if (elapsedTimeInMs > 500) {
      logger.warn(`[Slow Request] [${correlationId}] ${req.method} ${req.originalUrl} - ${res.statusCode} in ${elapsedTimeInMs}ms`);
    }
  });

  next();
};

module.exports = {
  requestIdMiddleware
};
