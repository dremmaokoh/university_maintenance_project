const express = require('express');
const { param } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');
const { updateUserValidators, listOrgMembersValidators } = require('../validators/userValidators');
const userService = require('../services/userService');

function createUserRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate(env.jwtSecret);

  router.get(
    '/',
    requireAuth,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
      const users = await userService.listUsers(req.user.organisationId);
      res.json({ success: true, data: users });
    })
  );

  router.get(
    '/officers',
    requireAuth,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
      const officers = await userService.listOfficers(req.user.organisationId);
      res.json({ success: true, data: officers });
    })
  );

  router.get(
    '/team/stats',
    requireAuth,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
      const stats = await userService.getTeamStats(req.user.organisationId);
      res.json({ success: true, data: stats });
    })
  );

  router.get(
    '/team/export',
    requireAuth,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
      const items = await userService.exportTeamUsers(req.user.organisationId);
      res.json({ success: true, data: { items } });
    })
  );

  router.get(
    '/members/stats',
    requireAuth,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
      const stats = await userService.getOrgMemberStats(req.user.organisationId);
      res.json({ success: true, data: stats });
    })
  );

  router.get(
    '/members',
    requireAuth,
    authorize(ROLES.ADMIN),
    listOrgMembersValidators,
    validate,
    asyncHandler(async (req, res) => {
      const data = await userService.listOrgMembers(req.user.organisationId, req.query);
      res.json({ success: true, data });
    })
  );

  router.get(
    '/members/export',
    requireAuth,
    authorize(ROLES.ADMIN),
    listOrgMembersValidators,
    validate,
    asyncHandler(async (req, res) => {
      const items = await userService.exportOrgMembers(req.user.organisationId, req.query);
      res.json({ success: true, data: { items } });
    })
  );

  router.get(
    '/:id/profile',
    requireAuth,
    authorize(ROLES.ADMIN),
    param('id').isMongoId(),
    validate,
    asyncHandler(async (req, res) => {
      const profile = await userService.getTeamMemberProfile(
        req.user.organisationId,
        req.params.id
      );
      res.json({ success: true, data: profile });
    })
  );

  router.get(
    '/:id',
    requireAuth,
    authorize(ROLES.ADMIN),
    param('id').isMongoId(),
    validate,
    asyncHandler(async (req, res) => {
      const user = await userService.getUserById(req.user.organisationId, req.params.id);
      res.json({ success: true, data: user });
    })
  );

  router.patch(
    '/:id',
    requireAuth,
    authorize(ROLES.ADMIN),
    updateUserValidators,
    validate,
    asyncHandler(async (req, res) => {
      const user = await userService.updateUser(
        req.user.organisationId,
        req.params.id,
        req.body,
        req.user.id
      );
      res.json({ success: true, data: user });
    })
  );

  return router;
}

module.exports = createUserRouter;
