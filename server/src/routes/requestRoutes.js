const express = require('express');
const { param } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');
const {
  createRequestValidators,
  listRequestValidators,
  assignRequestValidators,
  statusValidators,
  commentValidators,
  ratingValidators
} = require('../validators/requestValidators');
const requestService = require('../services/requestService');
const { uploadEvidence, handleUploadError, removeUploadedFile } = require('../middleware/uploadEvidence');

function createRequestRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate(env.jwtSecret);

  /**
   * @openapi
   * /requests:
   *   get:
   *     tags: [Requests]
   *     summary: List maintenance requests the caller is allowed to see
   *     operationId: listRequests
   *     description: Administrators see the organisation. Officers see requests assigned to them. Staff and students see their own requests. search matches title, description, and location. There is no date filter. Sort is by createdAt.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/Page'
   *       - $ref: '#/components/parameters/Limit'
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [pending, assigned, in_progress, completed] }
   *       - in: query
   *         name: category
   *         schema: { type: string }
   *         description: Category id.
   *       - $ref: '#/components/parameters/Search'
   *       - $ref: '#/components/parameters/Order'
   *     responses:
   *       '200':
   *         description: One page of requests.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RequestPage'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *   post:
   *     tags: [Requests]
   *     summary: Submit a maintenance request
   *     operationId: createRequest
   *     description: Role student only, which includes both staff and student member types. Send JSON when there is no file. Send multipart/form-data to attach evidence. Allowed types are JPEG, PNG, GIF, WebP, and PDF, up to 5 MB. Files are stored with Cloudinary when it is configured. The response includes file metadata only.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateRequest'
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/CreateRequest'
   *     responses:
   *       '201':
   *         description: Request created with status pending.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceRequest'
   *       '400':
   *         description: Validation failed, the category is not in this organisation, or the file was rejected.
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/ValidationErrorResponse'
   *                 - $ref: '#/components/schemas/ErrorResponse'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /requests/work/stats:
   *   get:
   *     tags: [Dashboard]
   *     summary: Count the signed-in officer's assigned work
   *     operationId: getOfficerWorkStats
   *     description: Maintenance officer only. pending in this payload counts requests whose status is assigned.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Assigned, in-progress, and completed counts.
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
   *                     pending: { type: integer }
   *                     inProgress: { type: integer }
   *                     completed: { type: integer }
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /requests/export:
   *   get:
   *     tags: [Reports]
   *     summary: Export visible requests as JSON
   *     operationId: exportRequests
   *     description: Administrator or maintenance officer. Same filters as the request list. Returns at most 2000 rows as JSON, not a CSV file. Officers only export requests assigned to them.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [pending, assigned, in_progress, completed] }
   *       - in: query
   *         name: category
   *         schema: { type: string }
   *       - $ref: '#/components/parameters/Search'
   *       - $ref: '#/components/parameters/Order'
   *     responses:
   *       '200':
   *         description: Request rows.
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
   *                         $ref: '#/components/schemas/MaintenanceRequest'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   * /requests/{id}/evidence:
   *   get:
   *     tags: [Requests]
   *     summary: Download evidence for a request
   *     operationId: getRequestEvidence
   *     description: Same visibility as reading the request. The body is the file itself, with Content-Disposition inline. Cloudinary files are fetched by the API and returned to the caller.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: JPEG, PNG, GIF, WebP, or PDF bytes.
   *         content:
   *           application/pdf:
   *             schema: { type: string, format: binary }
   *           image/jpeg:
   *             schema: { type: string, format: binary }
   *           image/png:
   *             schema: { type: string, format: binary }
   *           image/gif:
   *             schema: { type: string, format: binary }
   *           image/webp:
   *             schema: { type: string, format: binary }
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   * /requests/{id}:
   *   get:
   *     tags: [Requests]
   *     summary: Read one maintenance request
   *     operationId: getRequest
   *     description: Administrators can read any request in the organisation. Officers can read requests assigned to them. Requesters can read their own requests.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: Request with category, requester, and assigned officer when set.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceRequest'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   *   delete:
   *     tags: [Requests]
   *     summary: Delete a maintenance request
   *     operationId: deleteRequest
   *     description: Administrator only. Also removes the evidence file, assignment rows, status history, and comments.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: Request deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   * /requests/{id}/assign:
   *   post:
   *     tags: [Requests]
   *     summary: Assign a maintenance officer
   *     operationId: assignRequest
   *     description: Administrator only. Sets status to assigned.
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
   *             required: [officerId]
   *             properties:
   *               officerId: { type: string }
   *     responses:
   *       '200':
   *         description: Updated request.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceRequest'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   * /requests/{id}/unassign:
   *   post:
   *     tags: [Requests]
   *     summary: Cancel an assignment
   *     operationId: unassignRequest
   *     description: Administrator only. Allowed only while status is assigned. The request returns to pending.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: Request returned to pending.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceRequest'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   * /requests/{id}/status:
   *   patch:
   *     tags: [Requests]
   *     summary: Move a request to the next status
   *     operationId: updateRequestStatus
   *     description: Administrator, or the officer assigned to the request. The only allowed moves are pending to assigned, assigned to in_progress, and in_progress to completed.
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
   *             required: [status]
   *             properties:
   *               status: { type: string, enum: [pending, assigned, in_progress, completed] }
   *               note: { type: string }
   *     responses:
   *       '200':
   *         description: Updated request. A status history row is stored.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceRequest'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   * /requests/{id}/history:
   *   get:
   *     tags: [Requests]
   *     summary: Read status history
   *     operationId: getRequestHistory
   *     description: Same visibility as reading the request. Entries are oldest first.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: Status updates for this request.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/StatusHistoryEntry'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   * /requests/{id}/comments:
   *   get:
   *     tags: [Requests]
   *     summary: List comments on a request
   *     operationId: listRequestComments
   *     description: Administrators and the assigned officer see every comment. The requester sees their own comments and comments that mention them with @Full Name or the legacy @student marker.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       '200':
   *         description: Visible comments, oldest first.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Comment'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   *   post:
   *     tags: [Requests]
   *     summary: Add a comment
   *     operationId: addRequestComment
   *     description: The requester, the assigned officer, or an administrator. A comment from an administrator or officer becomes visible to the requester when the text mentions that requester.
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
   *             required: [body]
   *             properties:
   *               body: { type: string, example: "@Ada Lovelace the part has arrived." }
   *     responses:
   *       '201':
   *         description: Comment stored.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/Comment'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   * /requests/{id}/rating:
   *   post:
   *     tags: [Requests]
   *     summary: Rate the assigned officer
   *     operationId: rateRequest
   *     description: The requester only, after the request is completed and an officer is assigned. A request can be rated once.
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
   *             required: [stars]
   *             properties:
   *               stars: { type: integer, minimum: 1, maximum: 5 }
   *     responses:
   *       '201':
   *         description: Rating saved on the request.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceRequest'
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   *       '409':
   *         $ref: '#/components/responses/Conflict'
   */

  router.get(
    '/',
    requireAuth,
    listRequestValidators,
    validate,
    asyncHandler(async (req, res) => {
      const data = await requestService.listRequests(req.user, req.query);
      res.json({ success: true, data });
    })
  );

  router.get(
    '/work/stats',
    requireAuth,
    authorize(ROLES.OFFICER),
    asyncHandler(async (req, res) => {
      const stats = await requestService.getOfficerWorkStats(req.user);
      res.json({ success: true, data: stats });
    })
  );

  router.get(
    '/export',
    requireAuth,
    authorize(ROLES.ADMIN, ROLES.OFFICER),
    listRequestValidators,
    validate,
    asyncHandler(async (req, res) => {
      const items = await requestService.exportRequests(req.user, req.query);
      res.json({ success: true, data: { items } });
    })
  );

  router.post(
    '/',
    requireAuth,
    authorize(ROLES.STUDENT),
    (req, res, next) => {
      uploadEvidence.single('evidence')(req, res, (err) => {
        if (err) {
          handleUploadError(err, req, res, next);
          return;
        }
        next();
      });
    },
    createRequestValidators,
    validate,
    asyncHandler(async (req, res, next) => {
      try {
        const request = await requestService.createRequest(
          req.user,
          {
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            categoryId: req.body.categoryId
          },
          req.file
        );
        res.status(201).json({ success: true, data: request });
      } catch (error) {
        removeUploadedFile(req);
        next(error);
      }
    })
  );

  router.get(
    '/:id/evidence',
    requireAuth,
    param('id').isMongoId(),
    validate,
    asyncHandler(async (req, res) => {
      const file = await requestService.getRequestEvidenceFile(req.user, req.params.id);
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(file.originalName || 'evidence')}"`
      );
      if (file.buffer) {
        res.send(file.buffer);
        return;
      }
      res.sendFile(file.path);
    })
  );

  router.get(
    '/:id',
    requireAuth,
    param('id').isMongoId(),
    validate,
    asyncHandler(async (req, res) => {
      const request = await requestService.getRequestById(req.user, req.params.id);
      res.json({ success: true, data: request });
    })
  );

  router.delete(
    '/:id',
    requireAuth,
    authorize(ROLES.ADMIN),
    param('id').isMongoId(),
    validate,
    asyncHandler(async (req, res) => {
      await requestService.deleteRequest(req.user, req.params.id);
      res.json({ success: true, message: 'Request deleted.' });
    })
  );

  router.post(
    '/:id/assign',
    requireAuth,
    authorize(ROLES.ADMIN),
    assignRequestValidators,
    validate,
    asyncHandler(async (req, res) => {
      const request = await requestService.assignRequest(
        req.user,
        req.params.id,
        req.body.officerId
      );
      res.json({ success: true, data: request });
    })
  );

  router.post(
    '/:id/unassign',
    requireAuth,
    authorize(ROLES.ADMIN),
    param('id').isMongoId(),
    validate,
    asyncHandler(async (req, res) => {
      const request = await requestService.unassignRequest(req.user, req.params.id);
      res.json({ success: true, data: request });
    })
  );

  router.patch(
    '/:id/status',
    requireAuth,
    authorize(ROLES.ADMIN, ROLES.OFFICER),
    statusValidators,
    validate,
    asyncHandler(async (req, res) => {
      const request = await requestService.updateRequestStatus(req.user, req.params.id, {
        status: req.body.status,
        note: req.body.note
      });
      res.json({ success: true, data: request });
    })
  );

  router.get(
    '/:id/history',
    requireAuth,
    param('id').isMongoId(),
    validate,
    asyncHandler(async (req, res) => {
      const history = await requestService.getRequestHistory(req.user, req.params.id);
      res.json({ success: true, data: history });
    })
  );

  router.get(
    '/:id/comments',
    requireAuth,
    param('id').isMongoId(),
    validate,
    asyncHandler(async (req, res) => {
      const comments = await requestService.listRequestComments(req.user, req.params.id);
      res.json({ success: true, data: comments });
    })
  );

  router.post(
    '/:id/comments',
    requireAuth,
    commentValidators,
    validate,
    asyncHandler(async (req, res) => {
      const comment = await requestService.addRequestComment(
        req.user,
        req.params.id,
        req.body.body
      );
      res.status(201).json({ success: true, data: comment });
    })
  );

  router.post(
    '/:id/rating',
    requireAuth,
    authorize(ROLES.STUDENT),
    ratingValidators,
    validate,
    asyncHandler(async (req, res) => {
      const request = await requestService.rateAssignedOfficer(
        req.user,
        req.params.id,
        req.body.stars
      );
      res.status(201).json({ success: true, data: request });
    })
  );

  return router;
}

function createAssignmentRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate(env.jwtSecret);

  /**
   * @openapi
   * /assignments:
   *   get:
   *     tags: [Assignments]
   *     summary: List assignment records for the organisation
   *     operationId: listAssignments
   *     description: Administrator only. Newest assignments first.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Assignment history.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Assignment'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   */

  router.get(
    '/',
    requireAuth,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
      const assignments = await requestService.listAssignments(req.user.organisationId);
      res.json({ success: true, data: assignments });
    })
  );

  return router;
}

function createReportRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate(env.jwtSecret);

  /**
   * @openapi
   * /reports/summary:
   *   get:
   *     tags: [Reports]
   *     summary: Summarise requests by status and category
   *     operationId: getReportSummary
   *     description: Administrator only. Covers the whole organisation.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Totals grouped by status and category name.
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
   *                     byStatus:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           status: { type: string }
   *                           count: { type: integer }
   *                     byCategory:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           category: { type: string }
   *                           count: { type: integer }
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '403':
   *         $ref: '#/components/responses/Forbidden'
   */

  router.get(
    '/summary',
    requireAuth,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
      const summary = await requestService.getReportSummary(req.user.organisationId);
      res.json({ success: true, data: summary });
    })
  );

  return router;
}

module.exports = {
  createRequestRouter,
  createAssignmentRouter,
  createReportRouter
};
