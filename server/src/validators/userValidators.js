const { body, param } = require('express-validator');
const { ROLES } = require('../constants');

const createUserValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
  body('role')
    .isIn([ROLES.OFFICER, ROLES.ADMIN])
    .withMessage('Role must be officer or admin.')
];

const updateUserValidators = [
  param('id').isMongoId().withMessage('Invalid user id.'),
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty.'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false.')
];

module.exports = {
  createUserValidators,
  updateUserValidators
};
