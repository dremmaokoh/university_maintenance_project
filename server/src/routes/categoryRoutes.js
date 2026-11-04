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

  /**
   * @openapi
   * /categories:
   *   get:
   *     tags: [Categories]
   *     summary: List categories for the signed-in organisation
   *     operationId: listCategories
   *     description: Any authenticated role. The category named Other is listed last.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Categories sorted by name.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Category'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *   post:
   *     tags: [Categories]
   *     summary: Create a category
   *     operationId: createCategory
   *     description: Administrator or maintenance officer. Names must be unique within the organisation.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name: { type: string, example: Electrical }
   *               description: { type: string }
   *     responses:
   *       '201':
   *         description: Category created.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/Category'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '409':
   *         $ref: '#/components/responses/Conflict'
   * /categories/suggested:
   *   get:
   *     tags: [Categories]
   *     summary: List preset categories that this organisation has not added
   *     operationId: listSuggestedCategories
   *     description: Administrator or maintenance officer.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Remaining preset names and descriptions.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/SuggestedCategory'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /categories/{id}:
   *   patch:
   *     tags: [Categories]
   *     summary: Rename a category or change its description
   *     operationId: updateCategory
   *     description: Administrator only.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               description: { type: string }
   *     responses:
   *       '200':
   *         description: Updated category.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/Category'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   *   delete:
   *     tags: [Categories]
   *     summary: Delete a category
   *     operationId: deleteCategory
   *     description: Administrator only.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: Category removed.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   */

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
