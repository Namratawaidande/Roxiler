const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Generate a cryptographically signed JWT token for an authenticated user.
 * Includes standard claims (sub, iss, aud, iat, exp) and minimal required payload.
 */
const generateToken = (userPayload, expiresIn = jwtConfig.options.expiresIn) => {
  const payload = {
    id: userPayload.id,
    email: userPayload.email,
    role: userPayload.role,
    name: userPayload.name
  };

  return jwt.sign(payload, jwtConfig.secret, {
    subject: String(userPayload.id),
    expiresIn,
    algorithm: jwtConfig.options.algorithm,
    issuer: jwtConfig.options.issuer,
    audience: jwtConfig.options.audience
  });
};

/**
 * Verify and decode a JWT token.
 * Strictly verifies signature, algorithm whitelist (HS256), issuer, audience, and expiration.
 */
const verifyToken = (token) => {
  return jwt.verify(token, jwtConfig.secret, {
    algorithms: [jwtConfig.options.algorithm],
    issuer: jwtConfig.options.issuer,
    audience: jwtConfig.options.audience
  });
};

module.exports = {
  generateToken,
  verifyToken
};
