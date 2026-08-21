const env = require('./env');

const jwtConfig = {
  secret: env.JWT.SECRET,
  options: {
    expiresIn: env.JWT.EXPIRES_IN,
    algorithm: 'HS256'
  }
};

module.exports = jwtConfig;
