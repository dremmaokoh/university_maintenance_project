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

  /**
   * @openapi
   * /users:
   *   get:
   *     tags: [Users]
   *     summary: List administrators and maintenance officers
   *     operationId: listTeamUsers
   *     description: Administrator only. Officers who have been rated include averageRating and ratingCount.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Team accounts, newest first.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/PublicUser'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /users/officers:
   *   get:
   *     tags: [Users]
   *     summary: List active maintenance officers
   *     operationId: listOfficers
   *     description: Administrator only. Used when assigning a request.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Active officers, sorted by name.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/PublicUser'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /users/team/stats:
   *   get:
   *     tags: [Users]
   *     summary: Count team accounts
   *     operationId: getTeamStats
   *     description: Administrator only.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Totals for administrators, officers, active accounts, and inactive accounts.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     total: { type: integer }
   *                     admins: { type: integer }
   *                     officers: { type: integer }
   *                     active: { type: integer }
   *                     inactive: { type: integer }
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /users/team/export:
   *   get:
   *     tags: [Reports]
   *     summary: Export team accounts as JSON
   *     operationId: exportTeamUsers
   *     description: Administrator only. Returns JSON items for the client to turn into a spreadsheet. This is not a CSV download.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Team rows, including roleLabel and accountStatusLabel.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     items:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/PublicUser'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /users/members/stats:
   *   get:
   *     tags: [Users]
   *     summary: Count staff and student requesters
   *     operationId: getMemberStats
   *     description: Administrator only.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Requester totals.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     total: { type: integer }
   *                     staff: { type: integer }
   *                     students: { type: integer }
   *                     active: { type: integer }
   *                     inactive: { type: integer }
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /users/members:
   *   get:
   *     tags: [Users]
   *     summary: List staff and student requesters
   *     operationId: listOrgMembers
   *     description: Administrator only. Search matches name or email.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/Page'
   *       - $ref: '#/components/parameters/Limit'
   *       - $ref: '#/components/parameters/Search'
   *       - in: query
   *         name: memberType
   *         schema: { type: string, enum: [student, staff] }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [active, inactive] }
   *       - in: query
   *         name: sort
   *         schema: { type: string, enum: [name, joined], default: joined }
   *         description: joined sorts by the date the account was created.
   *       - $ref: '#/components/parameters/Order'
   *     responses:
   *       '200':
   *         description: One page of requesters.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     items:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/PublicUser'
   *                     page: { type: integer }
   *                     limit: { type: integer }
   *                     total: { type: integer }
   *                     totalPages: { type: integer }
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /users/members/export:
   *   get:
   *     tags: [Reports]
   *     summary: Export requesters as JSON
   *     operationId: exportOrgMembers
   *     description: Administrator only. Same filters as the member list. Returns at most 5000 rows as JSON, not a CSV file.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/Search'
   *       - in: query
   *         name: memberType
   *         schema: { type: string, enum: [student, staff] }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [active, inactive] }
   *       - in: query
   *         name: sort
   *         schema: { type: string, enum: [name, joined] }
   *       - $ref: '#/components/parameters/Order'
   *     responses:
   *       '200':
   *         description: Requester rows.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     items:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/PublicUser'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /users/{id}/profile:
   *   get:
   *     tags: [Users]
   *     summary: Read a team member profile
   *     operationId: getTeamMemberProfile
   *     description: Administrator only. Officer profiles include completed job count and average resolution time.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: Team member, labels, and officer performance when applicable.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   allOf:
   *                     - $ref: '#/components/schemas/PublicUser'
   *                     - type: object
   *                       properties:
   *                         performance:
   *                           type: object
   *                           nullable: true
   *                           properties:
   *                             completedCount: { type: integer }
   *                             averageResolutionTime: { type: string, nullable: true }
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   * /users/{id}:
   *   get:
   *     tags: [Users]
   *     summary: Read one user in the organisation
   *     operationId: getUser
   *     description: Administrator only.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: User record.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/PublicUser'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   *   patch:
   *     tags: [Users]
   *     summary: Update a team member
   *     operationId: updateUser
   *     description: Administrator only. Requester roles cannot be changed here. An administrator cannot change their own role or disable their own account. The organisation must keep one active administrator. Officers must keep a job title.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fullName: { type: string }
   *               role: { type: string, enum: [admin, officer] }
   *               isActive: { type: boolean }
   *               jobTitle: { type: string, maxLength: 80, nullable: true }
   *     responses:
   *       '200':
   *         description: Updated user.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/PublicUser'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   */

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
