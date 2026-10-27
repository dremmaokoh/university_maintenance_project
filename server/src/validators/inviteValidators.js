const { body, param } = require('express-validator');
const { INVITE_ROLES } = require('../constants');

const createInviteValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('role')
    .isIn(INVITE_ROLES)
    .withMessage('Role must be admin or officer.'),
  body('jobTitle')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 80 })
    .withMessage('Job title must be 80 characters or fewer.')
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
