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

  /**
   * @openapi
   * /auth/can-create-organisation:
   *   get:
   *     tags: [Authentication]
   *     summary: Check whether an email can create an organisation
   *     operationId: canCreateOrganisation
   *     parameters:
   *       - in: query
   *         name: email
   *         schema: { type: string, format: email }
   *         description: When omitted, the response is canCreate true.
   *     responses:
   *       '200':
   *         description: Whether this email has already created an organisation.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     canCreate: { type: boolean }
   * /auth/setup-admin:
   *   post:
   *     tags: [Authentication]
   *     summary: Create the first organisation and its administrator
   *     operationId: setupAdmin
   *     description: If this email already created an organisation that has no password yet, the same call finishes that setup. A completed organisation returns 409.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [organisationName, fullName, email, password]
   *             properties:
   *               organisationName: { type: string, example: North Campus }
   *               fullName: { type: string, example: Ada Lovelace }
   *               email: { type: string, format: email }
   *               password: { type: string, minLength: 8 }
   *     responses:
   *       '201':
   *         description: Organisation created and administrator signed in.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthSession'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '409':
   *         $ref: '#/components/responses/Conflict'
   * /auth/register:
   *   post:
   *     tags: [Authentication]
   *     summary: Register a staff or student requester
   *     operationId: register
   *     description: Both staff and students receive the role student. memberType records which one they are.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [orgSlug, fullName, email, memberType, password]
   *             properties:
   *               orgSlug: { type: string, example: north-campus }
   *               fullName: { type: string }
   *               email: { type: string, format: email }
   *               memberType: { type: string, enum: [student, staff] }
   *               password: { type: string, minLength: 8 }
   *     responses:
   *       '201':
   *         description: Account created and signed in.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthSession'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   *       '409':
   *         $ref: '#/components/responses/Conflict'
   * /auth/login:
   *   post:
   *     tags: [Authentication]
   *     summary: Log in
   *     operationId: login
   *     description: When the email matches more than one active organisation and neither organisationId, orgSlug, nor userId is sent, the response lists those accounts and does not include a token. Send the chosen userId on the next call.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string }
   *               organisationId: { type: string }
   *               orgSlug: { type: string }
   *               userId: { type: string }
   *     responses:
   *       '200':
   *         description: Signed in, or the caller must choose an account.
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/AuthSession'
   *                 - $ref: '#/components/schemas/AccountChoiceResponse'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         description: The account has been disabled.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   * /auth/forgot-password:
   *   post:
   *     tags: [Authentication]
   *     summary: Start a password reset
   *     operationId: forgotPassword
   *     description: Returns a reset path for the application to open. The same account-choice behaviour as login applies when one email belongs to several organisations.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email: { type: string, format: email }
   *               orgSlug: { type: string }
   *               userId: { type: string }
   *     responses:
   *       '200':
   *         description: Reset path issued, or the caller must choose an account.
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/AccountChoiceResponse'
   *                 - type: object
   *                   properties:
   *                     success: { type: boolean, example: true }
   *                     data:
   *                       type: object
   *                       properties:
   *                         resetPath: { type: string, example: /reset-password/example-token }
   *                         expiresInHours: { type: integer, example: 24 }
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   * /auth/reset-password/{token}:
   *   get:
   *     tags: [Authentication]
   *     summary: Preview a password reset link
   *     operationId: previewPasswordReset
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: Name, email, and organisation for this reset link.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     fullName: { type: string }
   *                     email: { type: string, format: email }
   *                     organisation:
   *                       type: object
   *                       nullable: true
   *                       properties:
   *                         name: { type: string }
   *                         slug: { type: string }
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   *       '410':
   *         $ref: '#/components/responses/Gone'
   *   post:
   *     tags: [Authentication]
   *     summary: Set a new password from a reset link
   *     operationId: resetPassword
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [password]
   *             properties:
   *               password: { type: string, minLength: 8 }
   *     responses:
   *       '200':
   *         description: Password updated and the user signed in.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthSession'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   *       '410':
   *         $ref: '#/components/responses/Gone'
   * /auth/me:
   *   get:
   *     tags: [Authentication]
   *     summary: Read the signed-in user
   *     operationId: getCurrentUser
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Current user and organisation.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/AuthUser'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   */

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
        memberType: req.body.memberType,
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
