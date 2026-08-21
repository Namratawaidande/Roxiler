const env = require('./env');

const jwtConfig = {
  secret: env.JWT.SECRET,
  options: {
    expiresIn: env.JWT.EXPIRES_IN || '24h',
    algorithm: 'HS256',
    issuer: 'store-rating-platform',
    audience: 'store-rating-api'
  }
};

module.exports = jwtConfig;
