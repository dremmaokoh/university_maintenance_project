const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
    return;
  }

  res.status(400).json({
    success: false,
    message: 'Please check the highlighted fields.',
    errors: errors.array().map((item) => ({
      field: item.path,
      message: item.msg
    }))
  });
}

module.exports = validate;
