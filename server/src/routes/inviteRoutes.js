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

  /**
   * @openapi
   * /invites:
   *   post:
   *     tags: [Invites]
   *     summary: Invite an administrator or maintenance officer
   *     operationId: createInvite
   *     description: Administrator only. A maintenance officer invite requires jobTitle. The response includes the raw invite token so the administrator can share the link. The token is not stored in plaintext.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [fullName, email, role]
   *             properties:
   *               fullName: { type: string }
   *               email: { type: string, format: email }
   *               role: { type: string, enum: [admin, officer] }
   *               jobTitle: { type: string, maxLength: 80, description: Required when role is officer. }
   *     responses:
   *       '201':
   *         description: Pending account created.
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
   *                       type: object
   *                       properties:
   *                         id: { type: string }
   *                         fullName: { type: string }
   *                         email: { type: string }
   *                         role: { type: string }
   *                         jobTitle: { type: string, nullable: true }
   *                     inviteToken: { type: string }
   *                     invitePath: { type: string, example: /invite/example-token }
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '409':
   *         $ref: '#/components/responses/Conflict'
   * /invites/{token}:
   *   get:
   *     tags: [Invites]
   *     summary: Preview an invitation
   *     operationId: previewInvite
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: Invited person, role, and organisation.
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
   *                     email: { type: string }
   *                     role: { type: string, enum: [admin, officer] }
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
   * /invites/{token}/accept:
   *   post:
   *     tags: [Invites]
   *     summary: Accept an invitation and set a password
   *     operationId: acceptInvite
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
   *         description: Account activated and signed in.
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
   */

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
          role: req.body.role,
          jobTitle: req.body.jobTitle
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
