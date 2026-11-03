const { body, param } = require('express-validator');
const { INVITE_ROLES } = require('../constants');

const createInviteValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('role')
    .isIn(INVITE_ROLES)
    .withMessage('Role must be admin or officer.'),
  body('jobTitle').custom((value, { req }) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (req.body.role === 'officer' && !trimmed) {
      throw new Error('Job title is required for maintenance officers.');
    }
    if (trimmed.length > 80) {
      throw new Error('Job title must be 80 characters or fewer.');
    }
    return true;
  })
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
