import { useEffect, useRef, useState } from 'react';

const ACCEPT =
  'image/jpeg,image/png,image/gif,image/webp,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.pdf';
const HINT = 'JPEG, PNG, GIF, WebP, or PDF (max 5 MB)';
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf']);
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
]);

function isAllowedFile(file) {
  if (!file) {
    return false;
  }
  if (file.type && ALLOWED_MIME.has(file.type)) {
    return true;
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext ? ALLOWED_EXTENSIONS.has(ext) : false;
}

export default function EvidenceUploadField({
  file,
  onFileChange,
  maxBytes = 5 * 1024 * 1024,
  onError
}) {
  const inputRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function reportError(message) {
    onError?.(message);
  }

  function validateAndPick(nextFile) {
    if (!nextFile) {
      onFileChange(null);
      return;
    }
    if (!isAllowedFile(nextFile)) {
      reportError('That file type is not supported. Use JPEG, PNG, GIF, WebP, or PDF.');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }
    if (nextFile.size > maxBytes) {
      reportError('File is too large. Maximum size is 5 MB.');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }
    onFileChange(nextFile);
  }

  function handleInputChange(event) {
    validateAndPick(event.target.files?.[0] || null);
  }

  function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setDragOver(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragOver(false);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setDragOver(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      validateAndPick(dropped);
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function clearFile() {
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className="evidence-upload">
      <input
        ref={inputRef}
        type="file"
        className="evidence-upload__input"
        accept={ACCEPT}
        onChange={handleInputChange}
        aria-label="Upload evidence file (optional)"
      />
      {!file && (
        <div
          className={`evidence-upload__dropzone${dragOver ? ' evidence-upload__dropzone--active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span className="evidence-upload__icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="evidence-upload__label">Upload a photo or document</p>
          <p className="evidence-upload__hint">Drag and drop a file here, or browse</p>
          <p className="evidence-upload__formats muted">{HINT}</p>
        </div>
      )}
      {file && (
        <div className="evidence-upload__selected">
          {previewUrl && (
            <img src={previewUrl} alt="Evidence preview" className="evidence-upload__preview" />
          )}
          <div className="evidence-upload__file-meta">
            <p className="evidence-upload__filename">{file.name}</p>
            <p className="muted evidence-upload__filesize">
              {Math.max(1, Math.round(file.size / 1024))} KB
            </p>
            <div className="evidence-upload__actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={openPicker}>
                Replace file
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearFile}>
                Remove file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
