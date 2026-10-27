const { ROLES } = require('../constants');

const REQUESTER_MENTION_PATTERN = /@student\b/i;

function isVisibleToRequester(body, authorRole) {
  if (authorRole === ROLES.STUDENT) {
    return false;
  }
  return REQUESTER_MENTION_PATTERN.test(body || '');
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
  REQUESTER_MENTION_PATTERN,
  isVisibleToRequester,
  filterCommentsForUser
};
