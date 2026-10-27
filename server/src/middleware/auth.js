const User = require('../models/User');
const HttpError = require('../utils/httpError');
const { verifyAccessToken } = require('../auth/tokens');
const asyncHandler = require('../utils/asyncHandler');

function authenticate(jwtSecret) {
  return asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Please log in to continue.');
    }

    let payload;
    try {
      payload = verifyAccessToken(token, jwtSecret);
    } catch (error) {
      throw new HttpError(401, 'Your session has expired. Please log in again.');
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive || user.accountStatus !== 'active') {
      throw new HttpError(401, 'Please log in to continue.');
    }

    req.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };
    next();
  });
}

module.exports = authenticate;
