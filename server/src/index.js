const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { loadEnv } = require('./config/env');
const { buildSwaggerSpec } = require('./config/swagger');
const { connectDatabase } = require('./database/connect');
const { getDatabaseHealth, describeMongoUri } = require('./database/connectionHealth');
const { repairStaleIndexes } = require('./database/repairIndexes');
const { ensureUploadsDir } = require('./utils/evidenceStorage');
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

async function start() {
  const env = loadEnv();
  const mongoMeta = describeMongoUri(env.mongoUri);
  console.log(
    `MongoDB target: ${mongoMeta.storage} — database "${mongoMeta.database || 'unknown'}"`
  );
  await connectDatabase(env.mongoUri);
  await repairStaleIndexes();
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

  const server = app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
    console.log(`Swagger UI at http://localhost:${env.port}/api/docs`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${env.port} is already in use. Another copy of the API is running. Stop it with Ctrl+C in that terminal, then run npm run dev once.`
      );
    } else {
      console.error('Failed to start server:', error.message);
    }
    process.exit(1);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
