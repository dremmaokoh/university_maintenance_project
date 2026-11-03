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
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
