const User = require('../models/User');
const HttpError = require('../utils/httpError');
const { ROLES, ACCOUNT_STATUS, INVITE_ROLES } = require('../constants');
const { generateInviteToken, hashInviteToken } = require('../utils/inviteToken');
const { hashPassword } = require('../auth/password');
const { enrichUser } = require('./authService');
const { normalizeAuthEmail } = require('../utils/normalizeAuthEmail');

function getInviteExpiryDate(days = 7) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}

async function createInvite(adminUser, { fullName, email, role }, inviteExpiryDays) {
  if (!INVITE_ROLES.includes(role)) {
    throw new HttpError(400, 'Invite role must be admin or officer.');
  }

  const normalizedEmail = normalizeAuthEmail(email);
  const existing = await User.findOne({
    email: normalizedEmail,
    organisation: adminUser.organisationId
  });
  if (existing) {
    throw new HttpError(409, 'This person already has an account in your organisation.');
  }

  const rawToken = generateInviteToken();
  const user = await User.create({
    fullName,
    email: normalizedEmail,
    role,
    organisation: adminUser.organisationId,
    accountStatus: ACCOUNT_STATUS.PENDING,
    passwordHash: null,
    inviteTokenHash: hashInviteToken(rawToken),
    inviteTokenExpiresAt: getInviteExpiryDate(inviteExpiryDays),
    invitedBy: adminUser.id,
    isActive: true
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    },
    inviteToken: rawToken
  };
}

async function getInvitePreview(rawToken) {
  const user = await User.findOne({
    inviteTokenHash: hashInviteToken(rawToken),
    accountStatus: ACCOUNT_STATUS.PENDING
  }).populate('organisation', 'name slug');

  if (!user) {
    throw new HttpError(404, 'This invite link is invalid or has already been used.');
  }

  if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt < new Date()) {
    throw new HttpError(410, 'This invite link has expired. Ask an administrator for a new one.');
  }

  return {
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    organisation: user.organisation
      ? { name: user.organisation.name, slug: user.organisation.slug }
      : null
  };
}

async function acceptInvite(rawToken, password, jwtSecret, jwtExpiresIn) {
  const user = await User.findOne({
    inviteTokenHash: hashInviteToken(rawToken),
    accountStatus: ACCOUNT_STATUS.PENDING
  }).select('+passwordHash +inviteTokenHash');

  if (!user) {
    throw new HttpError(404, 'This invite link is invalid or has already been used.');
  }

  if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt < new Date()) {
    throw new HttpError(410, 'This invite link has expired. Ask an administrator for a new one.');
  }

  user.passwordHash = await hashPassword(password);
  user.accountStatus = ACCOUNT_STATUS.ACTIVE;
  user.inviteTokenHash = null;
  user.inviteTokenExpiresAt = null;
  await user.save();

  const { createAccessToken } = require('../auth/tokens');
  const token = createAccessToken(user, jwtSecret, jwtExpiresIn);
  return { user: await enrichUser(user), token };
}

module.exports = {
  createInvite,
  getInvitePreview,
  acceptInvite
};
