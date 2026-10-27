const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { loadEnv } = require('./config/env');
const { buildSwaggerSpec } = require('./config/swagger');
const { connectDatabase } = require('./database/connect');
const errorHandler = require('./middleware/errorHandler');
const createAuthRouter = require('./routes/authRoutes');
const createUserRouter = require('./routes/userRoutes');
const createCategoryRouter = require('./routes/categoryRoutes');
const createInviteRouter = require('./routes/inviteRoutes');
const {
  createRequestRouter,
  createAssignmentRouter,
  createReportRouter
} = require('./routes/requestRoutes');

async function start() {
  const env = loadEnv();
  await connectDatabase(env.mongoUri);

  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true
    })
  );
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is running.' });
  });

  app.use('/api/auth', createAuthRouter(env));
  app.use('/api/users', createUserRouter(env));
  app.use('/api/invites', createInviteRouter(env));
  app.use('/api/categories', createCategoryRouter(env));
  app.use('/api/requests', createRequestRouter(env));
  app.use('/api/assignments', createAssignmentRouter(env));
  app.use('/api/reports', createReportRouter(env));

  const swaggerSpec = buildSwaggerSpec();
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
    console.log(`Swagger UI at http://localhost:${env.port}/api/docs`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
