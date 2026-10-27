const User = require('../models/User');
const HttpError = require('../utils/httpError');
const { ROLES, ROLE_VALUES, ACCOUNT_STATUS } = require('../constants');
const { toPublicUser } = require('./authService');

async function listUsers() {
  const users = await User.find().sort({ createdAt: -1 });
  return users.map(toPublicUser);
}

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }
  return toPublicUser(user);
}

async function updateUser(id, updates) {
  const user = await User.findById(id);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  if (updates.fullName) {
    user.fullName = updates.fullName;
  }
  if (typeof updates.isActive === 'boolean') {
    user.isActive = updates.isActive;
  }
  if (updates.role) {
    if (!ROLE_VALUES.includes(updates.role)) {
      throw new HttpError(400, 'Invalid role.');
    }
    user.role = updates.role;
  }

  await user.save();
  return toPublicUser(user);
}

async function listOfficers() {
  const officers = await User.find({
    role: ROLES.OFFICER,
    isActive: true,
    accountStatus: ACCOUNT_STATUS.ACTIVE
  }).sort({ fullName: 1 });
  return officers.map(toPublicUser);
}

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  listOfficers
};
