const { body } = require('express-validator');

const registerValidators = [
  body('orgSlug').trim().notEmpty().withMessage('Organisation link is required.'),
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('memberType')
    .isIn(['student', 'staff'])
    .withMessage('Choose whether you are Staff or Student.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
];

const loginValidators = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  body('organisationId').optional().isMongoId(),
  body('orgSlug').optional().trim(),
  body('userId').optional().isMongoId()
];

const forgotPasswordValidators = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('orgSlug').optional().trim(),
  body('userId').optional().isMongoId()
];

const resetPasswordValidators = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
];

module.exports = {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators
};
