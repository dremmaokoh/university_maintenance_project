const { loadEnv } = require('../config/env');
const { connectDatabase } = require('../database/connect');

async function run() {
  const env = loadEnv();
  await connectDatabase(env.mongoUri);
  console.log('Seed completed. No global data — create an organisation via /admin/register.');
  process.exit(0);
}

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
