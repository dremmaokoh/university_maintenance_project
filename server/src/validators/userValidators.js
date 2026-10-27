const { body, param, query } = require('express-validator');
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
  body('role')
    .optional()
    .isIn([ROLES.ADMIN, ROLES.OFFICER])
    .withMessage('Role must be administrator or maintenance officer.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false.'),
  body('jobTitle')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 80 })
    .withMessage('Job title must be 80 characters or fewer.')
];

const listOrgMembersValidators = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('search').optional().trim(),
  query('memberType').optional().isIn(['student', 'staff']),
  query('status').optional().isIn(['active', 'inactive']),
  query('sort').optional().isIn(['name', 'joined']),
  query('order').optional().isIn(['asc', 'desc'])
];

module.exports = {
  createUserValidators,
  updateUserValidators,
  listOrgMembersValidators
};
