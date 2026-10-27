/**
 * Local preview when MongoDB is not installed: in-memory DB + seed, then start API.
 * Use: npm run dev:preview
 */
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri('university_maintenance');

  process.env.MONGODB_URI = mongoUri;
  process.env.MONGODB_STORAGE = 'memory';
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'local-preview-jwt-secret-change-in-production';
  }

  const seed = spawn('node', [path.join(__dirname, 'seed.js')], {
    stdio: 'inherit',
    env: process.env,
    cwd: path.join(__dirname, '../..')
  });

  seed.on('exit', (code) => {
    if (code !== 0) {
      process.exit(code);
    }

    const server = spawn('node', ['--watch', path.join(__dirname, '../index.js')], {
      stdio: 'inherit',
      env: process.env,
      cwd: path.join(__dirname, '../..')
    });

    const shutdown = async () => {
      server.kill();
      await mongod.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
}

main().catch((error) => {
  console.error('Preview server failed:', error.message);
  process.exit(1);
});
