const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth');
const requestService = require('../services/requestService');

function createDashboardRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate(env.jwtSecret);

  router.get(
    '/overview',
    requireAuth,
    asyncHandler(async (req, res) => {
      const overview = await requestService.getDashboardOverview(req.user);
      res.json({ success: true, data: overview });
    })
  );

  return router;
}

module.exports = createDashboardRouter;
