const HttpError = require('../utils/httpError');

function authorize(...allowedRoles) {
  return function authorizeRole(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      next(new HttpError(403, 'You do not have permission to do that.'));
      return;
    }
    next();
  };
}

module.exports = authorize;
