const User = require('../models/User');
const Organisation = require('../models/Organisation');
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

    if (String(user.organisation) !== String(payload.organisationId)) {
      throw new HttpError(401, 'Please log in to continue.');
    }

    const org = await Organisation.findById(user.organisation);

    req.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organisationId: user.organisation,
      organisation: org
        ? { id: org.id, name: org.name, slug: org.slug }
        : null
    };
    next();
  });
}

module.exports = authenticate;
