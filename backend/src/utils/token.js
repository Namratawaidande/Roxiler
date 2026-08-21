const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Generate a signed JWT token for a user
 */
const generateToken = (payload, expiresIn = jwtConfig.options.expiresIn) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn,
    algorithm: jwtConfig.options.algorithm
  });
};

/**
 * Verify and decode a JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, jwtConfig.secret);
};

module.exports = {
  generateToken,
  verifyToken
};
