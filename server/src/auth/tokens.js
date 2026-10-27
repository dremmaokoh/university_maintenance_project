const jwt = require('jsonwebtoken');

function createAccessToken(user, jwtSecret, jwtExpiresIn) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
}

function verifyAccessToken(token, jwtSecret) {
  return jwt.verify(token, jwtSecret);
}

module.exports = {
  createAccessToken,
  verifyAccessToken
};
