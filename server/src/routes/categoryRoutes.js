const express = require('express');
const { param } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');
const {
  createCategoryValidators,
  updateCategoryValidators
} = require('../validators/categoryValidators');
const categoryService = require('../services/categoryService');

function createCategoryRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate(env.jwtSecret);

  router.get(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
      const categories = await categoryService.listCategories(req.user.organisationId);
      res.json({ success: true, data: categories });
    })
  );

  router.get(
    '/suggested',
    requireAuth,
    authorize(ROLES.ADMIN, ROLES.OFFICER),
    asyncHandler(async (req, res) => {
      const presets = await categoryService.listSuggestedPresets(req.user.organisationId);
      res.json({ success: true, data: presets });
    })
  );

  router.post(
    '/',
    requireAuth,
    authorize(ROLES.ADMIN, ROLES.OFFICER),
    createCategoryValidators,
    validate,
    asyncHandler(async (req, res) => {
      const category = await categoryService.createCategory(req.user.organisationId, req.body);
      res.status(201).json({ success: true, data: category });
    })
  );

  router.patch(
    '/:id',
    requireAuth,
    authorize(ROLES.ADMIN),
    updateCategoryValidators,
    validate,
    asyncHandler(async (req, res) => {
      const category = await categoryService.updateCategory(
        req.user.organisationId,
        req.params.id,
        req.body
      );
      res.json({ success: true, data: category });
    })
  );

  router.delete(
    '/:id',
    requireAuth,
    authorize(ROLES.ADMIN),
    param('id').isMongoId(),
    validate,
    asyncHandler(async (req, res) => {
      await categoryService.deleteCategory(req.user.organisationId, req.params.id);
      res.json({ success: true, message: 'Category deleted.' });
    })
  );

  return router;
}

module.exports = createCategoryRouter;
