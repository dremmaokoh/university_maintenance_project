const { normalizeEmail } = require('validator');

function normalizeAuthEmail(email) {
  if (!email) {
    return '';
  }
  const trimmed = String(email).trim();
  const normalized = normalizeEmail(trimmed);
  return (normalized || trimmed).toLowerCase();
}

module.exports = { normalizeAuthEmail };
