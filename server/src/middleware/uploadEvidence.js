const multer = require('multer');
const HttpError = require('../utils/httpError');
const { MAX_EVIDENCE_BYTES, ALLOWED_MIME_TYPES } = require('../utils/evidenceStorage');

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new HttpError(400, 'Allowed file types: JPEG, PNG, GIF, WebP, and PDF.'));
    return;
  }
  cb(null, true);
}

const uploadEvidence = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_EVIDENCE_BYTES }
});

function handleUploadError(err, req, res, next) {
  if (!err) {
    next();
    return;
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new HttpError(400, 'File is too large. Maximum size is 5 MB.'));
      return;
    }
    next(new HttpError(400, 'Could not upload file. Please try again.'));
    return;
  }
  next(err);
}

function removeUploadedFile() {
  // Evidence is held in memory until persisted to Cloudinary in the service layer.
}

module.exports = {
  uploadEvidence,
  handleUploadError,
  removeUploadedFile
};
