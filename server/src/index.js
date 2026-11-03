const { loadEnv } = require('./config/env');
const { connectDatabase } = require('./database/connect');
const { describeMongoUri } = require('./database/connectionHealth');
const { repairStaleIndexes } = require('./database/repairIndexes');
const { createApp } = require('./app');

async function start() {
  const env = loadEnv();
  const mongoMeta = describeMongoUri(env.mongoUri);
  console.log(
    `MongoDB target: ${mongoMeta.storage} — database "${mongoMeta.database || 'unknown'}"`
  );
  await connectDatabase(env.mongoUri);
  await repairStaleIndexes();

  const app = createApp(env);
  const server = app.listen(env.port, '0.0.0.0', () => {
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
