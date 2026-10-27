const { body } = require('express-validator');

const registerValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
];

const loginValidators = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
];

module.exports = {
  registerValidators,
  loginValidators
};
