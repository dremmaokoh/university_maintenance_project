const { ROLES, MEMBER_TYPES } = require('../constants');

function knownMemberType(value) {
  if (value === MEMBER_TYPES.STAFF || value === MEMBER_TYPES.STUDENT) {
    return value;
  }
  return undefined;
}

function isPopulatedAuthor(author) {
  if (!author || typeof author !== 'object') {
    return false;
  }
  return 'fullName' in author || 'role' in author || 'memberType' in author;
}

function buildAuthorSnapshot(user) {
  if (!user) {
    return undefined;
  }

  const snapshot = {};
  if (user.fullName) {
    snapshot.fullName = user.fullName;
  }
  if (user.role) {
    snapshot.role = user.role;
  }
  if (user.role === ROLES.STUDENT) {
    const memberType = knownMemberType(user.memberType);
    if (memberType) {
      snapshot.memberType = memberType;
    }
  }
  return snapshot;
}

function presentCommentAuthor(comment) {
  const snapshot = comment?.authorSnapshot || {};
  const populated = isPopulatedAuthor(comment?.author) ? comment.author : null;
  const role = populated?.role || snapshot.role;
  const fullName = populated?.fullName || snapshot.fullName;
  const id = populated ? populated.id || populated._id : undefined;

  let memberType;
  if (!role || role === ROLES.STUDENT) {
    memberType =
      knownMemberType(snapshot.memberType) ||
      (populated ? knownMemberType(populated.memberType) : undefined);
  }

  if (!fullName && !role && !id && !memberType) {
    return null;
  }

  const author = {
    id: id ? String(id) : null,
    fullName: fullName || '',
    role: role || null
  };
  if (memberType) {
    author.memberType = memberType;
  }
  return author;
}

module.exports = {
  buildAuthorSnapshot,
  presentCommentAuthor
};
