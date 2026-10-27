const express = require('express');
const { param } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');
const { updateUserValidators } = require('../validators/userValidators');
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
