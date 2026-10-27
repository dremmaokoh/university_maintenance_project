import FieldLabel from './FieldLabel.jsx';

const STAFF_HINT =
  'Comments without mentioning the requester are only visible to administrators and maintenance staff. Type @ to insert the requester’s name when they should see your message.';

const STUDENT_HINT =
  'Your comments are visible to administrators and maintenance staff. You will only see staff replies that mention you by name (or @student).';

export default function CommentComposer({
  value,
  onChange,
  onSubmit,
  submitting,
  disabled,
  role,
  requesterFullName,
  submitLabel = 'Post comment'
}) {
  const isStaff = role === 'admin' || role === 'officer';

  function handleKeyDown(event) {
    if (!isStaff || !requesterFullName || disabled || submitting) {
      return;
    }
    if (event.key !== '@' || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    event.preventDefault();
    const el = event.target;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const mention = `@${requesterFullName} `;
    const next = `${value.slice(0, start)}${mention}${value.slice(end)}`;
    onChange(next);
  }

  return (
    <form
      className="comment-composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label>
        <span className="label-row">
          <FieldLabel required>Comment</FieldLabel>
          {isStaff && requesterFullName && (
            <span className="hint-tooltip" title={STAFF_HINT} tabIndex={0}>
              @{requesterFullName}
            </span>
          )}
        </span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          required
          disabled={disabled || submitting}
          placeholder={
            isStaff
              ? `Add a note for staff, or type @ to mention ${requesterFullName || 'the requester'}…`
              : 'Write a comment…'
          }
        />
      </label>
      {!isStaff && <p className="muted comment-hint">{STUDENT_HINT}</p>}
      {isStaff && <p className="muted comment-hint">{STAFF_HINT}</p>}
      <button type="submit" className="btn btn-primary" disabled={disabled || submitting || !value.trim()}>
        {submitting ? 'Posting…' : submitLabel}
      </button>
    </form>
  );
}
