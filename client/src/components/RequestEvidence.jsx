import { useEffect, useState } from 'react';
import * as requestApi from '../api/requestApi.js';

export default function RequestEvidence({ token, requestId, evidence }) {
  const [objectUrl, setObjectUrl] = useState('');
  const [loadError, setLoadError] = useState('');

  const isImage = evidence?.mimeType?.startsWith('image/');

  useEffect(() => {
    if (!token || !requestId || !evidence) {
      return undefined;
    }

    let cancelled = false;

    requestApi
      .fetchRequestEvidence(token, requestId)
      .then((blob) => {
        if (cancelled) {
          return;
        }
        setObjectUrl(URL.createObjectURL(blob));
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message || 'Could not load evidence file.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, requestId, evidence]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  if (!evidence) {
    return null;
  }

  const sizeKb = evidence.size ? Math.max(1, Math.round(evidence.size / 1024)) : null;

  return (
    <section className="request-evidence card">
      <h2>Photo / file evidence</h2>
      <p className="muted">
        {evidence.originalName}
        {sizeKb ? ` · ${sizeKb} KB` : ''}
      </p>
      {loadError && <p className="form-error">{loadError}</p>}
      {!loadError && !objectUrl && <p className="muted">Loading file…</p>}
      {objectUrl && isImage && (
        <img className="evidence-image" src={objectUrl} alt={evidence.originalName || 'Evidence'} />
      )}
      {objectUrl && !isImage && (
        <a className="btn btn-secondary" href={objectUrl} download={evidence.originalName || 'evidence'}>
          Download PDF
        </a>
      )}
    </section>
  );
}
