const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators
} = require('../validators/authValidators');
const { bootstrapAdminValidators } = require('../validators/bootstrapValidators');
const authService = require('../services/authService');
const User = require('../models/User');
const { normalizeAuthEmail } = require('../utils/normalizeAuthEmail');

function createAuthRouter(env) {
  const router = express.Router();

  router.get(
    '/can-create-organisation',
    asyncHandler(async (req, res) => {
      const rawEmail = req.query.email;
      if (!rawEmail) {
        res.json({ success: true, data: { canCreate: true } });
        return;
      }
      const canCreate = await authService.canEmailCreateOrganisation(normalizeAuthEmail(rawEmail));
      res.json({ success: true, data: { canCreate } });
    })
  );

  router.post(
    '/setup-admin',
    bootstrapAdminValidators,
    validate,
    asyncHandler(async (req, res) => {
      const result = await authService.createBootstrapAdmin({
        organisationName: req.body.organisationName,
        fullName: req.body.fullName,
        email: req.body.email,
        password: req.body.password,
        jwtSecret: env.jwtSecret,
        jwtExpiresIn: env.jwtExpiresIn
      });
      res.status(201).json({ success: true, data: result });
    })
  );

  router.post(
    '/register',
    registerValidators,
    validate,
    asyncHandler(async (req, res) => {
      const result = await authService.registerStudent({
        orgSlug: req.body.orgSlug,
        fullName: req.body.fullName,
        email: req.body.email,
        password: req.body.password,
        jwtSecret: env.jwtSecret,
        jwtExpiresIn: env.jwtExpiresIn
      });
      res.status(201).json({ success: true, data: result });
    })
  );

  router.post(
    '/login',
    loginValidators,
    validate,
    asyncHandler(async (req, res) => {
      const result = await authService.login({
        email: req.body.email,
        password: req.body.password,
        organisationId: req.body.organisationId,
        orgSlug: req.body.orgSlug,
        userId: req.body.userId,
        jwtSecret: env.jwtSecret,
        jwtExpiresIn: env.jwtExpiresIn
      });
      res.json({ success: true, data: result });
    })
  );

  router.post(
    '/forgot-password',
    forgotPasswordValidators,
    validate,
    asyncHandler(async (req, res) => {
      const result = await authService.requestPasswordReset({
        email: req.body.email,
        orgSlug: req.body.orgSlug,
        userId: req.body.userId
      });
      res.json({ success: true, data: result });
    })
  );

  router.get(
    '/reset-password/:token',
    asyncHandler(async (req, res) => {
      const preview = await authService.getPasswordResetPreview(req.params.token);
      res.json({ success: true, data: preview });
    })
  );

  router.post(
    '/reset-password/:token',
    resetPasswordValidators,
    validate,
    asyncHandler(async (req, res) => {
      const result = await authService.completePasswordReset(
        req.params.token,
        req.body.password,
        env.jwtSecret,
        env.jwtExpiresIn
      );
      res.json({ success: true, data: result });
    })
  );

  router.get(
    '/me',
    authenticate(env.jwtSecret),
    asyncHandler(async (req, res) => {
      const user = await User.findById(req.user.id);
      const enriched = await authService.enrichUser(user);
      res.json({ success: true, data: { user: enriched } });
    })
  );

  return router;
}

module.exports = createAuthRouter;
