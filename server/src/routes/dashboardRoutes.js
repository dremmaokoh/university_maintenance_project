const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth');
const requestService = require('../services/requestService');

function createDashboardRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate(env.jwtSecret);

  /**
   * @openapi
   * /dashboard/overview:
   *   get:
   *     tags: [Dashboard]
   *     summary: Request counts and recent requests for the signed-in user
   *     operationId: getDashboardOverview
   *     description: Administrators see the organisation. Officers see assigned requests. Staff and students see their own requests. Counts use pending, assigned, in_progress, and completed separately.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Scoped statistics and up to six recent requests.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     stats:
   *                       type: object
   *                       properties:
   *                         total: { type: integer }
   *                         pending: { type: integer }
   *                         assigned: { type: integer }
   *                         inProgress: { type: integer }
   *                         completed: { type: integer }
   *                     recentRequests:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/MaintenanceRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   */

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
