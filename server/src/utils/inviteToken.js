const crypto = require('crypto');

function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashInviteToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateInviteToken,
  hashInviteToken
};
