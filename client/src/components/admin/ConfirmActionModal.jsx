import Modal from './Modal.jsx';

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false
}) {
  const confirmClass =
    variant === 'danger' ? 'btn btn-danger-outline' : 'btn btn-primary';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      preventClose={loading}
      footer={
        <div className="app-modal__footer-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={loading}>
            {loading ? 'Saving…' : confirmLabel}
          </button>
        </div>
      }
    />
  );
}
