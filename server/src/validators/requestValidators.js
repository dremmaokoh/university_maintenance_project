const { body, param, query } = require('express-validator');
const { STATUS_VALUES } = require('../constants');

const createRequestValidators = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('location').trim().notEmpty().withMessage('Location is required.'),
  body('categoryId').isMongoId().withMessage('A valid category is required.')
];

const listRequestValidators = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive number.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt().withMessage('Limit must be between 1 and 50.'),
  query('status').optional().isIn(STATUS_VALUES).withMessage('Invalid status.'),
  query('category').optional().isMongoId().withMessage('Invalid category.'),
  query('search').optional().trim()
];

const assignRequestValidators = [
  param('id').isMongoId().withMessage('Invalid request id.'),
  body('officerId').isMongoId().withMessage('A valid officer is required.')
];

const statusValidators = [
  param('id').isMongoId().withMessage('Invalid request id.'),
  body('status').isIn(STATUS_VALUES).withMessage('Invalid status.'),
  body('note').optional().trim()
];

module.exports = {
  createRequestValidators,
  listRequestValidators,
  assignRequestValidators,
  statusValidators
};
