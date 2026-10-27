const STAFF_HINT =
  'Comments without @student are only visible to administrators and maintenance staff. Include @student in your message when the requester should see it.';

const STUDENT_HINT =
  'Your comments are visible to administrators and maintenance staff. You will only see staff replies that include @student.';

export default function CommentComposer({
  value,
  onChange,
  onSubmit,
  submitting,
  disabled,
  role,
  submitLabel = 'Post comment'
}) {
  const isStaff = role === 'admin' || role === 'officer';

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
          Comment
          {isStaff && (
            <span className="hint-tooltip" title={STAFF_HINT} tabIndex={0}>
              @student visibility
            </span>
          )}
        </span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          required
          disabled={disabled || submitting}
          placeholder={isStaff ? 'Add a note for staff, or use @student to share with the requester…' : 'Write a comment…'}
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
