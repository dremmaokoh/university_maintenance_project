const User = require('../models/User');
const Organisation = require('../models/Organisation');
const HttpError = require('../utils/httpError');
const { ROLES, ACCOUNT_STATUS, MEMBER_TYPES } = require('../constants');
const { hashPassword, verifyPassword } = require('../auth/password');
const { createAccessToken } = require('../auth/tokens');
const organisationService = require('./organisationService');
const { generateInviteToken, hashInviteToken } = require('../utils/inviteToken');
const { normalizeAuthEmail } = require('../utils/normalizeAuthEmail');
const { debugSessionLog } = require('../utils/debugSessionLog');

const PASSWORD_RESET_HOURS = 24;

function getPasswordResetExpiry() {
  const expires = new Date();
  expires.setHours(expires.getHours() + PASSWORD_RESET_HOURS);
  return expires;
}

async function enrichUser(user) {
  const org = await Organisation.findById(user.organisation);
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    memberType: user.memberType || MEMBER_TYPES.STUDENT,
    accountStatus: user.accountStatus,
    organisationId: user.organisation,
    organisation: org
      ? { id: org.id, name: org.name, slug: org.slug }
      : null
  };
}

function toPublicUser(user, extras = {}) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    memberType: user.memberType || MEMBER_TYPES.STUDENT,
    accountStatus: user.accountStatus,
    isActive: user.isActive,
    jobTitle: user.jobTitle || null,
    organisationId: user.organisation,
    createdAt: user.createdAt,
    ...extras
  };
}

async function canEmailCreateOrganisation(email) {
  const blocked = await organisationService.emailHasCreatedOrganisation(email);
  return !blocked;
}

async function createBootstrapAdmin({
  organisationName,
  fullName,
  email,
  password,
  jwtSecret,
  jwtExpiresIn
}) {
  const normalizedEmail = normalizeAuthEmail(email);
  const existingOrg = await organisationService.findOrganisationByCreatorEmail(normalizedEmail);

  if (existingOrg) {
    let user = await User.findOne({
      organisation: existingOrg.id,
      email: normalizedEmail,
      role: ROLES.ADMIN
    }).select('+passwordHash');

    if (user?.passwordHash) {
      throw new HttpError(
        409,
        'This email has already been used to create an organisation. Kindly log in.'
      );
    }

    if (!user) {
      user = await ensureOrgCreatorUser(normalizedEmail);
      user = await User.findById(user.id).select('+passwordHash');
    }

    user.fullName = fullName;
    user.passwordHash = await hashPassword(password);
    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    user.isActive = true;
    await user.save();

    // #region agent log
    debugSessionLog({
      runId: 'post-fix',
      hypothesisId: 'H-no-password',
      location: 'authService.js:createBootstrapAdmin',
      message: 'set password on unfinished organisation admin',
      data: { hadUser: true, passwordSet: true }
    });
    // #endregion

    const token = createAccessToken(user, jwtSecret, jwtExpiresIn);
    return { user: await enrichUser(user), token };
  }

  const organisation = await organisationService.createOrganisation({
    name: organisationName,
    createdByEmail: email
  });

  const user = await User.create({
    fullName,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: ROLES.ADMIN,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    organisation: organisation.id
  });

  organisation.createdBy = user.id;
  await organisation.save();

  const token = createAccessToken(user, jwtSecret, jwtExpiresIn);
  return { user: await enrichUser(user), token };
}

async function ensureOrgCreatorUser(normalizedEmail) {
  const org = await organisationService.findOrganisationByCreatorEmail(normalizedEmail);
  if (!org) {
    return null;
  }

  let user = await User.findOne({
    organisation: org.id,
    email: normalizedEmail,
    role: ROLES.ADMIN
  });

  if (!user) {
    user = await User.create({
      fullName: 'Administrator',
      email: normalizedEmail,
      role: ROLES.ADMIN,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      organisation: org.id,
      passwordHash: null,
      isActive: true
    });
    org.createdBy = user.id;
    await org.save();
  }

  return user;
}

async function findActiveUsersForPasswordReset({ email, orgSlug, userId }) {
  const normalizedEmail = normalizeAuthEmail(email);
  let orgId;

  if (orgSlug) {
    const org = await Organisation.findOne({ slug: orgSlug.toLowerCase() });
    if (!org) {
      throw new HttpError(404, 'Organisation not found.');
    }
    orgId = org.id;
  }

  let candidates;
  if (userId) {
    candidates = await User.find({ _id: userId, email: normalizedEmail }).select('+passwordHash');
  } else {
    const query = { email: normalizedEmail };
    if (orgId) {
      query.organisation = orgId;
    }
    candidates = await User.find(query).select('+passwordHash');
  }

  return candidates.filter(
    (user) => user.isActive && user.accountStatus === ACCOUNT_STATUS.ACTIVE
  );
}

async function requestPasswordReset({ email, orgSlug, userId }) {
  let activeCandidates = await findActiveUsersForPasswordReset({ email, orgSlug, userId });

  if (activeCandidates.length === 0 && !orgSlug && !userId) {
    const normalizedEmail = normalizeAuthEmail(email);
    const recovered = await ensureOrgCreatorUser(normalizedEmail);
    if (recovered) {
      activeCandidates = [recovered];
    }
  }

  if (activeCandidates.length === 0) {
    throw new HttpError(404, 'Incorrect or invalid email.');
  }

  if (!orgSlug && !userId && activeCandidates.length > 1) {
    const orgIds = activeCandidates.map((u) => u.organisation);
    const orgs = await Organisation.find({ _id: { $in: orgIds } });
    const orgMap = new Map(orgs.map((o) => [String(o.id), o]));

    return {
      requiresAccountChoice: true,
      accounts: activeCandidates.map((user) => {
        const org = orgMap.get(String(user.organisation));
        return {
          userId: user.id,
          role: user.role,
          organisationName: org ? org.name : 'Organisation',
          organisationSlug: org ? org.slug : null
        };
      })
    };
  }

  const user = activeCandidates[0];
  const rawToken = generateInviteToken();
  user.passwordResetTokenHash = hashInviteToken(rawToken);
  user.passwordResetExpiresAt = getPasswordResetExpiry();
  await user.save();

  return {
    resetPath: `/reset-password/${rawToken}`,
    expiresInHours: PASSWORD_RESET_HOURS
  };
}

async function getPasswordResetPreview(rawToken) {
  const user = await User.findOne({
    passwordResetTokenHash: hashInviteToken(rawToken)
  }).populate('organisation', 'name slug');

  if (!user) {
    throw new HttpError(404, 'This reset link is invalid or has already been used.');
  }

  if (user.passwordResetExpiresAt && user.passwordResetExpiresAt < new Date()) {
    throw new HttpError(410, 'This reset link has expired. Request a new one from the login page.');
  }

  return {
    fullName: user.fullName,
    email: user.email,
    organisation: user.organisation
      ? { name: user.organisation.name, slug: user.organisation.slug }
      : null
  };
}

async function completePasswordReset(rawToken, password, jwtSecret, jwtExpiresIn) {
  const user = await User.findOne({
    passwordResetTokenHash: hashInviteToken(rawToken)
  }).select('+passwordHash');

  if (!user) {
    throw new HttpError(404, 'This reset link is invalid or has already been used.');
  }

  if (user.passwordResetExpiresAt && user.passwordResetExpiresAt < new Date()) {
    throw new HttpError(410, 'This reset link has expired. Request a new one from the login page.');
  }

  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  const token = createAccessToken(user, jwtSecret, jwtExpiresIn);
  return { user: await enrichUser(user), token };
}

async function registerStudent({
  orgSlug,
  fullName,
  email,
  password,
  memberType,
  jwtSecret,
  jwtExpiresIn
}) {
  const org = await Organisation.findOne({ slug: orgSlug.toLowerCase() });
  if (!org) {
    throw new HttpError(404, 'Organisation not found. Check your sign-up link.');
  }

  const normalizedEmail = normalizeAuthEmail(email);
  const existing = await User.findOne({ email: normalizedEmail, organisation: org.id });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists for this organisation.');
  }

  const resolvedMemberType =
    memberType === MEMBER_TYPES.STAFF ? MEMBER_TYPES.STAFF : MEMBER_TYPES.STUDENT;

  const user = await User.create({
    fullName,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: ROLES.STUDENT,
    memberType: resolvedMemberType,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    organisation: org.id
  });

  const token = createAccessToken(user, jwtSecret, jwtExpiresIn);
  return { user: await enrichUser(user), token };
}

function emailLookupValues(email) {
  const normalizedEmail = normalizeAuthEmail(email);
  const legacyLower = String(email).trim().toLowerCase();
  const values = new Set([normalizedEmail, legacyLower]);
  return Array.from(values).filter(Boolean);
}

async function login({ email, password, organisationId, orgSlug, userId, jwtSecret, jwtExpiresIn }) {
  const normalizedEmail = normalizeAuthEmail(email);
  const emailValues = emailLookupValues(email);
  let orgId = organisationId;

  if (orgSlug) {
    const org = await Organisation.findOne({ slug: orgSlug.toLowerCase() });
    if (!org) {
      throw new HttpError(404, 'Organisation not found.');
    }
    orgId = org.id;
  }

  let candidates;

  if (userId) {
    candidates = await User.find({
      _id: userId,
      email: { $in: emailValues }
    }).select('+passwordHash');
  } else {
    const query = { email: { $in: emailValues } };
    if (orgId) {
      query.organisation = orgId;
    }
    candidates = await User.find(query).select('+passwordHash');
  }

  // #region agent log
  debugSessionLog({
    runId: 'officer-login',
    hypothesisId: 'H-login',
    location: 'authService.js:login',
    message: 'login candidate counts',
    data: {
      candidatesCount: candidates.length,
      hasOrgSlug: Boolean(orgSlug),
      hasUserId: Boolean(userId),
      emailValueCount: emailValues.length
    }
  });
  // #endregion

  if (candidates.length === 0) {
    throw new HttpError(401, 'Incorrect or invalid email.');
  }

  const activeCandidates = candidates.filter(
    (user) =>
      user.isActive &&
      user.accountStatus === ACCOUNT_STATUS.ACTIVE &&
      user.passwordHash
  );

  if (activeCandidates.length === 0) {
    const statusBreakdown = candidates.reduce((acc, u) => {
      const key = `${u.accountStatus}:${Boolean(u.passwordHash)}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    // #region agent log
    debugSessionLog({
      runId: 'officer-login',
      hypothesisId: 'H-pending',
      location: 'authService.js:login',
      message: 'no active candidates',
      data: { statusBreakdown, roles: candidates.map((u) => u.role) }
    });
    // #endregion
    const pendingInvite = candidates.some(
      (user) => user.accountStatus === ACCOUNT_STATUS.PENDING && !user.passwordHash
    );
    const missingPassword = candidates.some(
      (user) => user.accountStatus === ACCOUNT_STATUS.ACTIVE && !user.passwordHash
    );
    if (missingPassword) {
      throw new HttpError(
        401,
        'This account does not have a password yet. Go back to Set up your organisation and submit again, or use Forgot password.'
      );
    }
    if (pendingInvite) {
      throw new HttpError(
        401,
        'Your officer account is not active yet. Open the invite link from your admin and set your password, then log in at /login.'
      );
    }
    const allDisabled = candidates.every((user) => !user.isActive);
    if (allDisabled) {
      throw new HttpError(
        403,
        'This account has been disabled. Contact your organisation administrator.'
      );
    }
    throw new HttpError(401, 'Incorrect or invalid email.');
  }

  if (!orgId && !userId && activeCandidates.length > 1) {
    const orgIds = activeCandidates.map((u) => u.organisation);
    const orgs = await Organisation.find({ _id: { $in: orgIds } });
    const orgMap = new Map(orgs.map((o) => [String(o.id), o]));

    return {
      requiresAccountChoice: true,
      accounts: activeCandidates.map((user) => {
        const org = orgMap.get(String(user.organisation));
        return {
          userId: user.id,
          role: user.role,
          organisationId: user.organisation,
          organisationName: org ? org.name : 'Organisation',
          organisationSlug: org ? org.slug : null
        };
      })
    };
  }

  const user = activeCandidates[0];
  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    throw new HttpError(401, 'Incorrect password.');
  }

  const token = createAccessToken(user, jwtSecret, jwtExpiresIn);
  return { user: await enrichUser(user), token };
}

module.exports = {
  toPublicUser,
  enrichUser,
  canEmailCreateOrganisation,
  createBootstrapAdmin,
  registerStudent,
  login,
  requestPasswordReset,
  getPasswordResetPreview,
  completePasswordReset
};
