import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  preventClose = false,
  ariaLabel,
  headerSlot,
  headerActions,
  panelClassName = 'app-modal__panel'
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    lastActiveRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event) {
      if (event.key === 'Escape' && !preventClose) {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);

    const focusTarget =
      panelRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) || panelRef.current;
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      if (lastActiveRef.current?.focus) {
        lastActiveRef.current.focus();
      }
    };
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) {
    return null;
  }

  function handleBackdropClick() {
    if (!preventClose) {
      onClose();
    }
  }

  function stopPropagation(event) {
    event.stopPropagation();
  }

  const modalTree = (
    <div className="app-modal" role="presentation" onClick={handleBackdropClick}>
      <div
        ref={panelRef}
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headerSlot || title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        aria-label={headerSlot && !title ? ariaLabel : ariaLabel}
        onClick={stopPropagation}
        tabIndex={-1}
      >
        <div
          className={`app-modal__header${headerSlot ? ' app-modal__header--slot' : ''}`}
        >
          <div className="app-modal__header-main">
            {headerSlot ? (
              typeof headerSlot === 'function' ? headerSlot(titleId, descId) : headerSlot
            ) : (
              <>
                <h2 id={titleId} className="app-modal__title">{title}</h2>
                {description && (
                  <p id={descId} className="app-modal__description">{description}</p>
                )}
              </>
            )}
          </div>
          {headerActions && (
            <div className="app-modal__header-actions">{headerActions}</div>
          )}
          <button
            type="button"
            className="app-modal__close"
            onClick={onClose}
            disabled={preventClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="app-modal__body">{children}</div>
        {footer && <div className="app-modal__footer">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(modalTree, document.body);
}
