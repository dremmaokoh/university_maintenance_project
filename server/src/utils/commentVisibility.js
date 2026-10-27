const { ROLES } = require('../constants');

const LEGACY_REQUESTER_MENTION_PATTERN = /@student\b/i;

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRequesterNamePattern(requesterFullName) {
  const trimmed = String(requesterFullName || '').trim();
  if (!trimmed) {
    return null;
  }
  return new RegExp(`@${escapeRegExp(trimmed)}`, 'i');
}

function isVisibleToRequester(body, authorRole, requesterFullName) {
  if (authorRole === ROLES.STUDENT) {
    return false;
  }
  const text = body || '';
  if (LEGACY_REQUESTER_MENTION_PATTERN.test(text)) {
    return true;
  }
  const namePattern = buildRequesterNamePattern(requesterFullName);
  if (namePattern && namePattern.test(text)) {
    return true;
  }
  return false;
}

function filterCommentsForUser(comments, user, requesterId) {
  const isRequester = String(user.id) === String(requesterId);

  if (user.role === ROLES.ADMIN || user.role === ROLES.OFFICER) {
    return comments;
  }

  if (!isRequester) {
    return [];
  }

  return comments.filter(
    (comment) =>
      String(comment.author.id) === String(user.id) || comment.visibleToRequester
  );
}

module.exports = {
  LEGACY_REQUESTER_MENTION_PATTERN,
  isVisibleToRequester,
  filterCommentsForUser,
  buildRequesterNamePattern
};
