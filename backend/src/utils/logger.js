/**
 * Simple formatted logger utility
 */
const formatTime = () => new Date().toISOString();

const logger = {
  info: (msg, meta = '') => {
    console.log(`[${formatTime()}] [INFO]  ${msg}`, meta ? meta : '');
  },
  warn: (msg, meta = '') => {
    console.warn(`[${formatTime()}] [WARN]  ${msg}`, meta ? meta : '');
  },
  error: (msg, meta = '') => {
    console.error(`[${formatTime()}] [ERROR] ${msg}`, meta ? meta : '');
  },
  debug: (msg, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${formatTime()}] [DEBUG] ${msg}`, meta ? meta : '');
    }
  }
};

module.exports = logger;
