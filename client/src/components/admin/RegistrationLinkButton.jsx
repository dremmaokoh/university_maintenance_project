import { useState } from 'react';
import RegistrationLinkModal from './RegistrationLinkModal.jsx';
import { SHARE_REGISTRATION_LINK_LABEL } from '../../utils/teamAccessCopy.js';
import { buildAppUrl } from '../../utils/appUrl.js';

export default function RegistrationLinkButton({
  slug,
  label = SHARE_REGISTRATION_LINK_LABEL,
  className = 'btn btn-primary'
}) {
  const [open, setOpen] = useState(false);
  const registerUrl = slug ? buildAppUrl(`/o/${slug}/register`) : '';

  if (!slug) {
    return null;
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <RegistrationLinkModal
        isOpen={open}
        onClose={() => setOpen(false)}
        registerUrl={registerUrl}
      />
    </>
  );
}
