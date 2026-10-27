const User = require('../models/User');
const Request = require('../models/Request');
const HttpError = require('../utils/httpError');
const { ROLES, ROLE_VALUES, ACCOUNT_STATUS, STATUSES } = require('../constants');
const { formatDurationFromMs } = require('../utils/formatResolution');
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

const MEMBER_EXPORT_MAX = 5000;

function memberAccountStatus(user) {
  if (user.isActive && user.accountStatus === ACCOUNT_STATUS.ACTIVE) {
    return 'active';
  }
  return 'inactive';
}

function buildOrgMemberFilter(organisationId, query = {}) {
  const and = [{ organisation: organisationId, role: ROLES.STUDENT }];

  if (query.memberType === 'student' || query.memberType === 'staff') {
    and.push({ memberType: query.memberType });
  }

  if (query.status === 'active') {
    and.push({ isActive: true, accountStatus: ACCOUNT_STATUS.ACTIVE });
  } else if (query.status === 'inactive') {
    and.push({
      $or: [{ isActive: false }, { accountStatus: { $ne: ACCOUNT_STATUS.ACTIVE } }]
    });
  }

  if (query.search) {
    const pattern = new RegExp(query.search, 'i');
    and.push({ $or: [{ fullName: pattern }, { email: pattern }] });
  }

  return { $and: and };
}

function memberSort(query = {}) {
  const sortKey = query.sort === 'name' ? 'fullName' : 'createdAt';
  const direction = query.order === 'asc' ? 1 : -1;
  return { [sortKey]: direction };
}

function toPublicOrgMember(user) {
  const base = toPublicUser(user);
  return {
    ...base,
    accountStatusLabel: memberAccountStatus(user) === 'active' ? 'Active' : 'Inactive'
  };
}

async function listUsers(organisationId) {
  const users = await User.find({
    organisation: organisationId,
    role: { $in: [ROLES.ADMIN, ROLES.OFFICER] }
  }).sort({ createdAt: -1 });
  return attachOfficerRatingStats(users);
}

async function getTeamStats(organisationId) {
  const team = await User.find({
    organisation: organisationId,
    role: { $in: [ROLES.ADMIN, ROLES.OFFICER] }
  });

  let active = 0;
  let inactive = 0;
  let admins = 0;
  let officers = 0;

  team.forEach((user) => {
    if (user.role === ROLES.ADMIN) {
      admins += 1;
    }
    if (user.role === ROLES.OFFICER) {
      officers += 1;
    }
    if (memberAccountStatus(user) === 'active') {
      active += 1;
    } else {
      inactive += 1;
    }
  });

  return {
    total: team.length,
    admins,
    officers,
    active,
    inactive
  };
}

async function getOrgMemberStats(organisationId) {
  const members = await User.find({
    organisation: organisationId,
    role: ROLES.STUDENT
  });

  let staff = 0;
  let students = 0;
  let active = 0;
  let inactive = 0;

  members.forEach((user) => {
    if (user.memberType === 'staff') {
      staff += 1;
    } else {
      students += 1;
    }
    if (memberAccountStatus(user) === 'active') {
      active += 1;
    } else {
      inactive += 1;
    }
  });

  return {
    total: members.length,
    staff,
    students,
    active,
    inactive
  };
}

async function listOrgMembers(organisationId, query) {
  const filter = buildOrgMemberFilter(organisationId, query);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    User.find(filter).sort(memberSort(query)).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    items: items.map(toPublicOrgMember),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1
  };
}

async function exportOrgMembers(organisationId, query) {
  const filter = buildOrgMemberFilter(organisationId, query);
  const items = await User.find(filter).sort(memberSort(query)).limit(MEMBER_EXPORT_MAX);
  return items.map(toPublicOrgMember);
}

async function exportTeamUsers(organisationId) {
  const users = await User.find({
    organisation: organisationId,
    role: { $in: [ROLES.ADMIN, ROLES.OFFICER] }
  }).sort({ createdAt: -1 });
  const withRatings = await attachOfficerRatingStats(users);
  return withRatings.map((user) => ({
    ...user,
    accountStatusLabel: user.isActive && user.accountStatus === ACCOUNT_STATUS.ACTIVE
      ? 'Active'
      : 'Inactive',
    roleLabel:
      user.role === ROLES.ADMIN
        ? 'Administrator'
        : user.role === ROLES.OFFICER
          ? 'Maintenance officer'
          : user.role
  }));
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

  if (updates.fullName !== undefined) {
    const trimmedName = String(updates.fullName).trim();
    if (!trimmedName) {
      throw new HttpError(400, 'Full name cannot be empty.');
    }
    user.fullName = trimmedName;
  }

  if (updates.role && user.role !== updates.role) {
    if (![ROLES.ADMIN, ROLES.OFFICER].includes(updates.role)) {
      throw new HttpError(400, 'Role must be administrator or maintenance officer.');
    }
    if (user.role === ROLES.STUDENT) {
      throw new HttpError(400, 'Requester account roles cannot be changed.');
    }
    if (![ROLES.ADMIN, ROLES.OFFICER].includes(user.role)) {
      throw new HttpError(400, 'Only team accounts can have their role updated here.');
    }
    if (String(user.id) === String(actingUserId)) {
      throw new HttpError(400, 'You cannot change your own role.');
    }
    if (user.role === ROLES.ADMIN && updates.role === ROLES.OFFICER) {
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
    user.role = updates.role;
  }

  if (updates.jobTitle !== undefined) {
    const trimmedTitle = String(updates.jobTitle || '').trim();
    if (user.role === ROLES.OFFICER) {
      if (!trimmedTitle) {
        throw new HttpError(400, 'Job title is required for maintenance officers.');
      }
      user.jobTitle = trimmedTitle;
    } else {
      user.jobTitle = trimmedTitle || null;
    }
  }

  const touchesNameRoleOrTitle =
    updates.fullName !== undefined ||
    updates.role !== undefined ||
    updates.jobTitle !== undefined;
  if (
    touchesNameRoleOrTitle &&
    user.role === ROLES.OFFICER &&
    !String(user.jobTitle || '').trim()
  ) {
    throw new HttpError(400, 'Job title is required for maintenance officers.');
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

async function getOfficerPerformanceStats(organisationId, officerId) {
  const rows = await Request.aggregate([
    {
      $match: {
        organisation: organisationId,
        assignedOfficer: officerId,
        status: STATUSES.COMPLETED
      }
    },
    {
      $project: {
        completedAt: { $ifNull: ['$completedAt', '$updatedAt'] },
        createdAt: 1
      }
    },
    {
      $project: {
        durationMs: { $subtract: ['$completedAt', '$createdAt'] }
      }
    },
    {
      $match: {
        durationMs: { $gte: 0 }
      }
    },
    {
      $group: {
        _id: null,
        completedCount: { $sum: 1 },
        averageDurationMs: { $avg: '$durationMs' }
      }
    }
  ]);

  if (rows.length === 0) {
    return {
      completedCount: 0,
      averageResolutionTime: null
    };
  }

  return {
    completedCount: rows[0].completedCount,
    averageResolutionTime: formatDurationFromMs(rows[0].averageDurationMs)
  };
}

async function getTeamMemberProfile(organisationId, userId) {
  const user = await User.findOne({
    _id: userId,
    organisation: organisationId,
    role: { $in: [ROLES.ADMIN, ROLES.OFFICER] }
  });
  if (!user) {
    throw new HttpError(404, 'Team member not found.');
  }

  const [publicUser] = await attachOfficerRatingStats([user]);
  const accountStatusLabel =
    publicUser.isActive && publicUser.accountStatus === ACCOUNT_STATUS.ACTIVE
      ? 'Active'
      : 'Inactive';

  let performance = null;
  if (user.role === ROLES.OFFICER) {
    performance = await getOfficerPerformanceStats(organisationId, user._id);
  }

  return {
    ...publicUser,
    accountStatusLabel,
    roleLabel:
      user.role === ROLES.ADMIN
        ? 'Administrator'
        : user.role === ROLES.OFFICER
          ? 'Maintenance officer'
          : user.role,
    performance
  };
}

module.exports = {
  listUsers,
  getTeamStats,
  getOrgMemberStats,
  listOrgMembers,
  exportOrgMembers,
  exportTeamUsers,
  getUserById,
  getTeamMemberProfile,
  updateUser,
  listOfficers
};
