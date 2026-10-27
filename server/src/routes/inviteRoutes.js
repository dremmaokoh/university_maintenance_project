const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');
const { createInviteValidators, acceptInviteValidators } = require('../validators/inviteValidators');
const inviteService = require('../services/inviteService');

function createInviteRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate(env.jwtSecret);

  router.post(
    '/',
    requireAuth,
    authorize(ROLES.ADMIN),
    createInviteValidators,
    validate,
    asyncHandler(async (req, res) => {
      const result = await inviteService.createInvite(
        req.user,
        {
          fullName: req.body.fullName,
          email: req.body.email,
          role: req.body.role
        },
        env.inviteExpiryDays
      );
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          inviteToken: result.inviteToken,
          invitePath: `/invite/${result.inviteToken}`
        }
      });
    })
  );

  router.get(
    '/:token',
    asyncHandler(async (req, res) => {
      const preview = await inviteService.getInvitePreview(req.params.token);
      res.json({ success: true, data: preview });
    })
  );

  router.post(
    '/:token/accept',
    acceptInviteValidators,
    validate,
    asyncHandler(async (req, res) => {
      const result = await inviteService.acceptInvite(
        req.params.token,
        req.body.password,
        env.jwtSecret,
        env.jwtExpiresIn
      );
      res.json({ success: true, data: result });
    })
  );

  return router;
}

module.exports = createInviteRouter;
