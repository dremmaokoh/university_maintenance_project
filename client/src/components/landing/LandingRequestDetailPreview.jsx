export default function LandingRequestDetailPreview() {
  return (
    <div className="lp-preview lp-preview-detail" aria-hidden="true">
      <p className="lp-preview-back">← Back to requests</p>
      <div className="lp-detail-head">
        <h3 className="lp-detail-title">Lecture hall projector</h3>
        <span className="lp-preview-badge lp-preview-badge-in-progress">in progress</span>
      </div>
      <p className="lp-detail-meta">AV · Hall A · Officer: James O.</p>
      <p className="lp-detail-desc">
        Screen goes blank during lectures. Parts ordered and visit scheduled.
      </p>
      <div className="lp-detail-panel">
        <p className="lp-detail-panel-title">Status history</p>
        <ul className="lp-timeline">
          <li>
            <span className="lp-timeline-dot" />
            <div>
              <strong>In progress</strong>
              <span>Parts ordered — visible to requester</span>
            </div>
          </li>
          <li>
            <span className="lp-timeline-dot lp-timeline-dot-muted" />
            <div>
              <strong>Assigned</strong>
              <span>Facilities team</span>
            </div>
          </li>
          <li>
            <span className="lp-timeline-dot lp-timeline-dot-muted" />
            <div>
              <strong>Submitted</strong>
              <span>Student report</span>
            </div>
          </li>
        </ul>
      </div>
      <div className="lp-detail-actions">
        <span className="lp-detail-action">Mark completed</span>
        <span className="lp-detail-action lp-detail-action-muted">Post comment</span>
      </div>
    </div>
  );
}
