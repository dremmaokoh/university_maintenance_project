const Category = require('../models/Category');
const User = require('../models/User');

async function collectionExists(collection) {
  const name = collection.collectionName;
  const existing = await collection.conn.db.listCollections({ name }).toArray();
  return existing.length > 0;
}

async function dropLegacySingleFieldIndex(collection, fieldName) {
  if (!(await collectionExists(collection))) {
    return;
  }

  const indexes = await collection.indexes();
  for (const idx of indexes) {
    const keys = Object.keys(idx.key || {});
    if (keys.length === 1 && keys[0] === fieldName && idx.name !== '_id_') {
      await collection.dropIndex(idx.name);
      console.log(`Dropped legacy index ${collection.collectionName}.${idx.name}`);
    }
  }
}

async function repairStaleIndexes() {
  await dropLegacySingleFieldIndex(Category.collection, 'name');
  await Category.syncIndexes();

  await dropLegacySingleFieldIndex(User.collection, 'email');
  await User.syncIndexes();
}

module.exports = { repairStaleIndexes };
