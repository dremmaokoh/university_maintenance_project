const { loadEnv } = require('../config/env');
const { connectDatabase } = require('../database/connect');
const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Electrical', description: 'Power, lighting, and wiring issues' },
  { name: 'Plumbing', description: 'Leaks, taps, and drainage' },
  { name: 'Furniture', description: 'Desks, chairs, and fittings' },
  { name: 'Internet', description: 'Network and connectivity' },
  { name: 'Classroom Equipment', description: 'Projectors, boards, and AV' },
  { name: 'Hostel Maintenance', description: 'Residential facilities' }
];

async function seedCategories() {
  for (const item of DEFAULT_CATEGORIES) {
    const exists = await Category.findOne({ name: new RegExp(`^${item.name}$`, 'i') });
    if (exists) {
      console.log(`Category already exists: ${item.name}`);
      continue;
    }
    await Category.create(item);
    console.log(`Created category: ${item.name}`);
  }
}

async function run() {
  const env = loadEnv();
  await connectDatabase(env.mongoUri);
  await seedCategories();
  console.log('Seed completed (categories only). Create the first admin via /admin/register.');
  process.exit(0);
}

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
