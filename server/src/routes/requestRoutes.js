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
