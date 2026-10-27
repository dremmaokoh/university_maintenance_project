const { body, param } = require('express-validator');

const createCategoryValidators = [
  body('name').trim().notEmpty().withMessage('Category name is required.'),
  body('description').optional().trim()
];

const updateCategoryValidators = [
  param('id').isMongoId().withMessage('Invalid category id.'),
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty.'),
  body('description').optional().trim()
];

module.exports = {
  createCategoryValidators,
  updateCategoryValidators
};
