const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const organisationService = require('../services/organisationService');

function createOrganisationRouter() {
  const router = express.Router();

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
