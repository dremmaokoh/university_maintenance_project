const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const organisationService = require('../services/organisationService');

function createOrganisationRouter() {
  const router = express.Router();

  /**
   * @openapi
   * /organisations/{slug}:
   *   get:
   *     tags: [Organisations]
   *     summary: Look up an organisation by its signup slug
   *     operationId: getOrganisationBySlug
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema: { type: string, example: north-campus }
   *     responses:
   *       '200':
   *         description: Public organisation name and slug.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/Organisation'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   */

  router.get(
    '/:slug',
    asyncHandler(async (req, res) => {
      const organisation = await organisationService.getOrganisationBySlug(req.params.slug);
      res.json({ success: true, data: organisation });
    })
  );

  return router;
}

module.exports = createOrganisationRouter;
