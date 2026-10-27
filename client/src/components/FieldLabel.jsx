/**
 * Accessible required/optional markers for form labels (modern * convention).
 */
export default function FieldLabel({
  children,
  required = false,
  optional = false,
  htmlFor,
  className = ''
}) {
  const classes = `field-label${className ? ` ${className}` : ''}`;

  const content = (
    <>
      <span className="field-label__text">{children}</span>
      {required && (
        <>
          <span className="field-label__required" aria-hidden="true">*</span>
          <span className="visually-hidden"> (required)</span>
        </>
      )}
      {optional && <span className="field-label__optional">(optional)</span>}
    </>
  );

  if (htmlFor) {
    return (
      <label className={classes} htmlFor={htmlFor}>
        {content}
      </label>
    );
  }

  return <span className={classes}>{content}</span>;
}
