const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../../app');
const { connectDatabase, disconnectDatabase } = require('../../database/connect');
const User = require('../../models/User');
const Category = require('../../models/Category');
const { hashPassword } = require('../../auth/password');
const { ROLES, ACCOUNT_STATUS } = require('../../constants');

const TEST_PASSWORD = 'password123';

const TEST_ENV = {
  port: 0,
  mongoUri: 'mongodb://127.0.0.1:27017/test',
  jwtSecret: 'test-jwt-secret-for-university-maintenance',
  jwtExpiresIn: '1d',
  clientOrigin: 'http://localhost:5173',
  inviteExpiryDays: 7,
  cloudinary: {
    cloudName: 'test-cloud',
    apiKey: 'test-key',
    apiSecret: 'test-secret'
  }
};

let mongoServer;
let app;

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function startTestApp() {
  mongoServer = await MongoMemoryServer.create();
  TEST_ENV.mongoUri = mongoServer.getUri();
  await connectDatabase(TEST_ENV.mongoUri);
  app = createApp(TEST_ENV);
  return app;
}

async function stopTestApp() {
  await mongoose.connection.dropDatabase().catch(() => {});
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
  app = null;
}

async function clearDatabase() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}

async function createOrganisationFixture() {
  const api = request(app);
  const adminRes = await api.post('/api/auth/setup-admin').send({
    organisationName: 'Test University',
    fullName: 'Ada Admin',
    email: 'admin@test.edu',
    password: TEST_PASSWORD
  });

  if (adminRes.status !== 201) {
    throw new Error(`Failed to create admin: ${adminRes.status} ${JSON.stringify(adminRes.body)}`);
  }

  const admin = adminRes.body.data;
  const slug = admin.user.organisation.slug;
  const organisationId = admin.user.organisationId;

  const studentRes = await api.post('/api/auth/register').send({
    orgSlug: slug,
    fullName: 'Sam Student',
    email: 'student@test.edu',
    password: TEST_PASSWORD,
    memberType: 'student'
  });

  if (studentRes.status !== 201) {
    throw new Error(
      `Failed to register student: ${studentRes.status} ${JSON.stringify(studentRes.body)}`
    );
  }

  await User.create({
    fullName: 'Olivia Officer',
    email: 'officer@test.edu',
    passwordHash: await hashPassword(TEST_PASSWORD),
    role: ROLES.OFFICER,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    organisation: organisationId,
    jobTitle: 'Electrician',
    isActive: true
  });

  const officerRes = await api.post('/api/auth/login').send({
    email: 'officer@test.edu',
    password: TEST_PASSWORD,
    orgSlug: slug
  });

  const categories = await Category.find({ organisation: organisationId }).sort({ name: 1 });

  return {
    slug,
    organisationId,
    categories,
    categoryId: String(categories[0]._id),
    admin: {
      token: admin.token,
      user: admin.user
    },
    student: {
      token: studentRes.body.data.token,
      user: studentRes.body.data.user
    },
    officer: {
      token: officerRes.body.data.token,
      user: officerRes.body.data.user
    }
  };
}

async function createRequestAsStudent(token, payload) {
  return request(app).post('/api/requests').set(authHeader(token)).send(payload);
}

module.exports = {
  TEST_PASSWORD,
  TEST_ENV,
  authHeader,
  startTestApp,
  stopTestApp,
  clearDatabase,
  createOrganisationFixture,
  createRequestAsStudent,
  getApp: () => app
};
