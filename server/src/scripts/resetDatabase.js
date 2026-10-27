const mongoose = require('mongoose');
const { loadEnv } = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../database/connect');

async function run() {
  if (!process.argv.includes('--confirm')) {
    console.error('This deletes all data in the database from MONGODB_URI.');
    console.error('Run: npm run db:reset -- --confirm');
    process.exit(1);
  }

  const env = loadEnv();
  await connectDatabase(env.mongoUri);

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  for (const collection of collections) {
    await db.dropCollection(collection.name);
    console.log(`Dropped ${collection.name}`);
  }

  if (collections.length === 0) {
    console.log('Database was already empty.');
  } else {
    console.log('Database cleared. You can register a new organisation at /admin/register.');
  }

  await disconnectDatabase();
  process.exit(0);
}

run().catch((error) => {
  console.error('Reset failed:', error.message);
  process.exit(1);
});
