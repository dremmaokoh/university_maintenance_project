const User = require('../models/User');
const HttpError = require('../utils/httpError');
const { ROLES, ACCOUNT_STATUS } = require('../constants');
const { hashPassword, verifyPassword } = require('../auth/password');
const { createAccessToken } = require('../auth/tokens');

function toPublicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus
  };
}

async function isBootstrapAvailable() {
  const adminCount = await User.countDocuments({ role: ROLES.ADMIN, accountStatus: ACCOUNT_STATUS.ACTIVE });
  return adminCount === 0;
}

async function createBootstrapAdmin({ fullName, email, password, jwtSecret, jwtExpiresIn }) {
  const available = await isBootstrapAvailable();
  if (!available) {
    throw new HttpError(403, 'An administrator already exists. Use the login page or ask for an invite.');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role: ROLES.ADMIN,
    accountStatus: ACCOUNT_STATUS.ACTIVE
  });

  const token = createAccessToken(user, jwtSecret, jwtExpiresIn);
  return { user: toPublicUser(user), token };
}

async function registerStudent({ fullName, email, password, jwtSecret, jwtExpiresIn }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role: ROLES.STUDENT,
    accountStatus: ACCOUNT_STATUS.ACTIVE
  });

  const token = createAccessToken(user, jwtSecret, jwtExpiresIn);
  return { user: toPublicUser(user), token };
}

async function login({ email, password, jwtSecret, jwtExpiresIn }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  if (user.accountStatus === ACCOUNT_STATUS.PENDING || !user.passwordHash) {
    throw new HttpError(401, 'Please complete your invite setup before logging in.');
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  const token = createAccessToken(user, jwtSecret, jwtExpiresIn);
  return { user: toPublicUser(user), token };
}

module.exports = {
  toPublicUser,
  isBootstrapAvailable,
  createBootstrapAdmin,
  registerStudent,
  login
};
