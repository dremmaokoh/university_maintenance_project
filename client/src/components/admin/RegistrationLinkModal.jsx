import Modal from './Modal.jsx';
import CopyLinkField from './CopyLinkField.jsx';
import {
  REGISTRATION_SECTION_LEAD,
  REGISTRATION_SECTION_TITLE
} from '../../utils/teamAccessCopy.js';

export default function RegistrationLinkModal({ isOpen, onClose, registerUrl }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={REGISTRATION_SECTION_TITLE}
      description={REGISTRATION_SECTION_LEAD}
      footer={
        <div className="app-modal__footer-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {registerUrl ? (
        <CopyLinkField
          label="Registration link"
          value={registerUrl}
          copyButtonLabel="Copy registration link"
          copySuccessMessage="Registration link copied."
          showInlineSuccess
        />
      ) : (
        <p className="muted">Registration link is not available for this organisation.</p>
      )}
    </Modal>
  );
}
