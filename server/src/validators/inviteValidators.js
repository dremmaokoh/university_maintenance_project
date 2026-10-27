const { body, param } = require('express-validator');
const { INVITE_ROLES } = require('../constants');

const createInviteValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('role')
    .isIn(INVITE_ROLES)
    .withMessage('Role must be admin or officer.')
];

const acceptInviteValidators = [
  param('token').trim().notEmpty().withMessage('Invite token is required.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
];

module.exports = {
  createInviteValidators,
  acceptInviteValidators
};
