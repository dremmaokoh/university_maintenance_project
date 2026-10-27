const mongoose = require('mongoose');

async function connectDatabase(mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = {
  connectDatabase,
  disconnectDatabase
};
