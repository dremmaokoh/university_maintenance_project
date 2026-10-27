const mongoose = require('mongoose');

function describeMongoUri(mongoUri) {
  if (!mongoUri || typeof mongoUri !== 'string') {
    return { storage: 'unknown', database: null, host: null };
  }

  if (process.env.MONGODB_STORAGE === 'memory') {
    return { storage: 'memory', database: 'university_maintenance', host: 'in-memory' };
  }

  if (mongoUri.startsWith('mongodb+srv://')) {
    const hostMatch = mongoUri.match(/@([^/?]+)/);
    const dbMatch = mongoUri.match(/\.mongodb\.net\/([^?]+)/);
    return {
      storage: 'atlas',
      host: hostMatch ? hostMatch[1] : null,
      database: dbMatch ? dbMatch[1] : null
    };
  }

  const localMatch = mongoUri.match(/^mongodb:\/\/[^/]+\/([^?]+)/);
  return {
    storage: 'local',
    host: 'localhost',
    database: localMatch ? localMatch[1] : null
  };
}

function getDatabaseHealth(mongoUri) {
  const meta = describeMongoUri(mongoUri);
  const conn = mongoose.connection;
  const connected = conn.readyState === 1;

  let storage = meta.storage;
  let host = meta.host;
  if (connected && conn.host) {
    host = conn.host;
    if (conn.host.includes('mongodb.net')) {
      storage = 'atlas';
    } else if (conn.host === 'localhost' || conn.host === '127.0.0.1') {
      storage = 'local';
    }
  }

  return {
    connected,
    storage,
    name: connected && conn.db ? conn.db.databaseName : meta.database,
    host
  };
}

module.exports = { getDatabaseHealth, describeMongoUri };
