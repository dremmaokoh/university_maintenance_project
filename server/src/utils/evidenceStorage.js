const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
]);

function getUploadsDir() {
  return path.join(__dirname, '../../uploads/evidence');
}

function ensureUploadsDir() {
  const dir = getUploadsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function extensionForMime(mimeType) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf'
  };
  return map[mimeType] || '';
}

function buildStorageKey(mimeType) {
  return `${crypto.randomUUID()}${extensionForMime(mimeType)}`;
}

function getEvidenceAbsolutePath(storageKey) {
  return path.join(getUploadsDir(), storageKey);
}

function deleteEvidenceFile(evidence) {
  if (!evidence?.storageKey) {
    return;
  }
  const absolutePath = getEvidenceAbsolutePath(evidence.storageKey);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

function evidenceFromMulterFile(file) {
  if (!file) {
    return null;
  }
  return {
    originalName: file.originalname,
    storageKey: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date()
  };
}

module.exports = {
  MAX_EVIDENCE_BYTES,
  ALLOWED_MIME_TYPES,
  getUploadsDir,
  ensureUploadsDir,
  buildStorageKey,
  getEvidenceAbsolutePath,
  deleteEvidenceFile,
  evidenceFromMulterFile
};
