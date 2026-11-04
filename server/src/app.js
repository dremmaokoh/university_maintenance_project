const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { buildSwaggerSpec } = require('./config/swagger');
const { getDatabaseHealth } = require('./database/connectionHealth');
const { configureEvidenceStorage, ensureUploadsDir } = require('./utils/evidenceStorage');
const errorHandler = require('./middleware/errorHandler');
const createAuthRouter = require('./routes/authRoutes');
const createUserRouter = require('./routes/userRoutes');
const createCategoryRouter = require('./routes/categoryRoutes');
const createInviteRouter = require('./routes/inviteRoutes');
const createOrganisationRouter = require('./routes/organisationRoutes');
const createDashboardRouter = require('./routes/dashboardRoutes');
const {
  createRequestRouter,
  createAssignmentRouter,
  createReportRouter
} = require('./routes/requestRoutes');

function createApp(env) {
  configureEvidenceStorage(env);
  ensureUploadsDir();

  const app = express();

  const corsOrigins = new Set(
    [
      env.clientOrigin,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173'
    ].filter(Boolean)
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || corsOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true
    })
  );
  app.use(express.json());

  /**
   * @openapi
   * /health:
   *   get:
   *     tags: [Health]
   *     summary: Check that the API and database are reachable
   *     operationId: getHealth
   *     responses:
   *       '200':
   *         description: API process is running. `database.connected` reports the MongoDB connection.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 message: { type: string, example: API is running. }
   *                 database:
   *                   $ref: '#/components/schemas/DatabaseHealth'
   */
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'API is running.',
      database: getDatabaseHealth(env.mongoUri)
    });
  });

  app.use('/api/auth', createAuthRouter(env));
  app.use('/api/users', createUserRouter(env));
  app.use('/api/invites', createInviteRouter(env));
  app.use('/api/organisations', createOrganisationRouter());
  app.use('/api/dashboard', createDashboardRouter(env));
  app.use('/api/categories', createCategoryRouter(env));
  app.use('/api/requests', createRequestRouter(env));
  app.use('/api/assignments', createAssignmentRouter(env));
  app.use('/api/reports', createReportRouter(env));

  const swaggerSpec = buildSwaggerSpec();
  /**
   * @openapi
   * /docs.json:
   *   get:
   *     tags: [Health]
   *     summary: Download the OpenAPI specification
   *     operationId: getOpenApiSpec
   *     responses:
   *       '200':
   *         description: Generated OpenAPI 3 document used by Swagger UI.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  app.get('/api/docs.json', (req, res) => {
    res.json(swaggerSpec);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
