const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
]);

const STORAGE_CLOUDINARY = 'cloudinary';
const STORAGE_LOCAL = 'local';

let cloudinaryReady = false;

function configureEvidenceStorage(env) {
  if (!env?.cloudinary) {
    return;
  }
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true
  });
  cloudinaryReady = true;
}

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

function isCloudinaryEvidence(evidence) {
  if (!evidence?.storageKey) {
    return false;
  }
  if (evidence.storageProvider === STORAGE_CLOUDINARY) {
    return true;
  }
  return evidence.storageKey.startsWith('resolva/');
}

function formatForPrivateDownload(mimeType) {
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (mimeType === 'image/png') {
    return 'png';
  }
  if (mimeType === 'image/gif') {
    return 'gif';
  }
  if (mimeType === 'image/webp') {
    return 'webp';
  }
  return 'jpg';
}

function resourceTypeForMime(mimeType) {
  return mimeType === 'application/pdf' ? 'raw' : 'image';
}

function assertCloudinaryConfigured() {
  if (!cloudinaryReady) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }
}

function uploadBufferToCloudinary(buffer, organisationId) {
  assertCloudinaryConfigured();
  const folder = `resolva/evidence/${organisationId}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        unique_filename: true,
        overwrite: false
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function saveBufferToLocalDisk(file) {
  ensureUploadsDir();
  const storageKey = buildStorageKey(file.mimetype);
  const absolutePath = getEvidenceAbsolutePath(storageKey);
  fs.writeFileSync(absolutePath, file.buffer);
  console.info(
    `[evidence] Stored on server disk (local): ${storageKey} · ${file.originalname}`
  );
  return {
    originalName: file.originalname,
    storageKey,
    storageProvider: STORAGE_LOCAL,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date()
  };
}

async function createEvidenceFromUpload(file, organisationId) {
  if (!file?.buffer) {
    return null;
  }

  try {
    const result = await uploadBufferToCloudinary(file.buffer, organisationId);
    console.info(
      `[evidence] Stored in Cloudinary: ${result.public_id} · ${file.originalname}`
    );
    return {
      originalName: file.originalname,
      storageKey: result.public_id,
      storageProvider: STORAGE_CLOUDINARY,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error(
      'Cloudinary evidence upload failed; saving locally instead:',
      error.http_code || '',
      error.message
    );
    if (error.http_code === 403) {
      console.error(
        'Cloudinary returned 403: your API key is valid for Admin API (ping) but may lack Upload permission (action "create"). In Cloudinary Console → Settings → API Keys, use a key with Upload API access or assign create permission, then update server/.env.'
      );
    }
    return saveBufferToLocalDisk(file);
  }
}

async function fetchCloudinaryEvidenceBuffer(evidence) {
  assertCloudinaryConfigured();
  const resourceType = resourceTypeForMime(evidence.mimeType);
  const url = cloudinary.url(evidence.storageKey, {
    resource_type: resourceType,
    type: 'upload',
    secure: true,
    sign_url: true
  });

  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error('Evidence file is missing.');
    error.statusCode = 404;
    throw error;
  }

  return Buffer.from(await response.arrayBuffer());
}

async function deleteEvidenceFile(evidence) {
  if (!evidence?.storageKey) {
    return;
  }

  if (isCloudinaryEvidence(evidence)) {
    assertCloudinaryConfigured();
    const resourceType = resourceTypeForMime(evidence.mimeType);
    try {
      await cloudinary.uploader.destroy(evidence.storageKey, {
        resource_type: resourceType
      });
    } catch {
      // Best-effort cleanup; ignore missing assets.
    }
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
    storageProvider: STORAGE_LOCAL,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date()
  };
}

module.exports = {
  MAX_EVIDENCE_BYTES,
  ALLOWED_MIME_TYPES,
  STORAGE_CLOUDINARY,
  STORAGE_LOCAL,
  configureEvidenceStorage,
  getUploadsDir,
  ensureUploadsDir,
  buildStorageKey,
  getEvidenceAbsolutePath,
  isCloudinaryEvidence,
  createEvidenceFromUpload,
  fetchCloudinaryEvidenceBuffer,
  deleteEvidenceFile,
  evidenceFromMulterFile
};
