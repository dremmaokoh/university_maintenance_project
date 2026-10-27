const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const { registerValidators, loginValidators } = require('../validators/authValidators');
const { bootstrapAdminValidators } = require('../validators/bootstrapValidators');
const authService = require('../services/authService');

function createAuthRouter(env) {
  const router = express.Router();

  router.get(
    '/setup-available',
    asyncHandler(async (req, res) => {
      const available = await authService.isBootstrapAvailable();
      res.json({ success: true, data: { setupAvailable: available } });
    })
  );

  router.post(
    '/setup-admin',
    bootstrapAdminValidators,
    validate,
    asyncHandler(async (req, res) => {
      const result = await authService.createBootstrapAdmin({
        fullName: req.body.fullName,
        email: req.body.email,
        password: req.body.password,
        jwtSecret: env.jwtSecret,
        jwtExpiresIn: env.jwtExpiresIn
      });
      res.status(201).json({ success: true, data: result });
    })
  );

  /**
   * @openapi
   * /api/auth/register:
   *   post:
   *     summary: Register a student account
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [fullName, email, password]
   *             properties:
   *               fullName: { type: string }
   *               email: { type: string }
   *               password: { type: string }
   */
  router.post(
    '/register',
    registerValidators,
    validate,
    asyncHandler(async (req, res) => {
      const result = await authService.registerStudent({
        fullName: req.body.fullName,
        email: req.body.email,
        password: req.body.password,
        jwtSecret: env.jwtSecret,
        jwtExpiresIn: env.jwtExpiresIn
      });
      res.status(201).json({ success: true, data: result });
    })
  );

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     summary: Log in
   *     tags: [Auth]
   */
  router.post(
    '/login',
    loginValidators,
    validate,
    asyncHandler(async (req, res) => {
      const result = await authService.login({
        email: req.body.email,
        password: req.body.password,
        jwtSecret: env.jwtSecret,
        jwtExpiresIn: env.jwtExpiresIn
      });
      res.json({ success: true, data: result });
    })
  );

  /**
   * @openapi
   * /api/auth/me:
   *   get:
   *     summary: Current user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    '/me',
    authenticate(env.jwtSecret),
    asyncHandler(async (req, res) => {
      res.json({ success: true, data: { user: req.user } });
    })
  );

  return router;
}

module.exports = createAuthRouter;
