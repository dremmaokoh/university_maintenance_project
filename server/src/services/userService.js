const User = require('../models/User');
const Request = require('../models/Request');
const HttpError = require('../utils/httpError');
const { ROLES, ROLE_VALUES, ACCOUNT_STATUS } = require('../constants');
const { toPublicUser } = require('./authService');

async function attachOfficerRatingStats(users) {
  const officerIds = users.filter((u) => u.role === ROLES.OFFICER).map((u) => u._id);
  if (officerIds.length === 0) {
    return users.map((user) => toPublicUser(user));
  }

  const aggregates = await Request.aggregate([
    {
      $match: {
        assignedOfficer: { $in: officerIds },
        officerRating: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$assignedOfficer',
        averageRating: { $avg: '$officerRating' },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  const statsByOfficer = new Map(
    aggregates.map((row) => [
      String(row._id),
      {
        averageRating: Math.round(row.averageRating * 10) / 10,
        ratingCount: row.ratingCount
      }
    ])
  );

  return users.map((user) => {
    const stats = statsByOfficer.get(String(user._id));
    return toPublicUser(
      user,
      user.role === ROLES.OFFICER && stats
        ? { averageRating: stats.averageRating, ratingCount: stats.ratingCount }
        : {}
    );
  });
}

async function listUsers(organisationId) {
  const users = await User.find({
    organisation: organisationId,
    role: { $in: [ROLES.ADMIN, ROLES.OFFICER] }
  }).sort({ createdAt: -1 });
  return attachOfficerRatingStats(users);
}

async function getUserById(organisationId, id) {
  const user = await User.findOne({ _id: id, organisation: organisationId });
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }
  const [publicUser] = await attachOfficerRatingStats([user]);
  return publicUser;
}

async function updateUser(organisationId, id, updates, actingUserId) {
  const user = await User.findOne({ _id: id, organisation: organisationId });
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  if (updates.role && user.role !== updates.role) {
    if (!ROLE_VALUES.includes(updates.role)) {
      throw new HttpError(400, 'Invalid role.');
    }
    if (![ROLES.ADMIN, ROLES.OFFICER].includes(user.role)) {
      throw new HttpError(400, 'Only staff accounts can be updated here.');
    }
    user.role = updates.role;
  }

  if (typeof updates.isActive === 'boolean' && updates.isActive !== user.isActive) {
    if (String(user.id) === String(actingUserId) && updates.isActive === false) {
      throw new HttpError(400, 'You cannot disable your own account.');
    }
    if (updates.isActive === false && user.role === ROLES.ADMIN) {
      const otherActiveAdmins = await User.countDocuments({
        organisation: organisationId,
        role: ROLES.ADMIN,
        isActive: true,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        _id: { $ne: user.id }
      });
      if (otherActiveAdmins === 0) {
        throw new HttpError(400, 'Your organisation must have at least one active administrator.');
      }
    }
    user.isActive = updates.isActive;
  }

  if (updates.fullName) {
    user.fullName = updates.fullName;
  }

  await user.save();
  const [publicUser] = await attachOfficerRatingStats([user]);
  return publicUser;
}

async function listOfficers(organisationId) {
  const officers = await User.find({
    organisation: organisationId,
    role: ROLES.OFFICER,
    isActive: true,
    accountStatus: ACCOUNT_STATUS.ACTIVE
  }).sort({ fullName: 1 });
  return attachOfficerRatingStats(officers);
}

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  listOfficers
};
