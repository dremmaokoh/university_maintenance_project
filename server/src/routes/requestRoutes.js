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
  statusValidators
} = require('../validators/requestValidators');
const requestService = require('../services/requestService');

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

  router.post(
    '/',
    requireAuth,
    authorize(ROLES.STUDENT),
    createRequestValidators,
    validate,
    asyncHandler(async (req, res) => {
      const request = await requestService.createRequest(req.user, {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        categoryId: req.body.categoryId
      });
      res.status(201).json({ success: true, data: request });
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
      await requestService.deleteRequest(req.params.id);
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
      const assignments = await requestService.listAssignments();
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
      const summary = await requestService.getReportSummary();
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
