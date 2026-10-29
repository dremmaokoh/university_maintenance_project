import { useState } from 'react';
import { Link } from 'react-router-dom';
import ResolvaLogo from './ResolvaLogo.jsx';
import LandingSectionLink from './LandingSectionLink.jsx';

const LINKS = [
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'features', label: 'Features' },
  { id: 'for-universities', label: 'For Universities' }
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="landing-nav-wrap">
      <nav className="landing-nav" aria-label="Main">
        <Link to="/" className="landing-nav-brand" onClick={closeMenu}>
          <ResolvaLogo />
        </Link>

        <div className="landing-nav-center">
          {LINKS.map((link) => (
            <LandingSectionLink
              key={link.id}
              sectionId={link.id}
              className="landing-nav-link"
              onNavigate={closeMenu}
            >
              {link.label}
            </LandingSectionLink>
          ))}
        </div>

        <div className="landing-nav-actions">
          <Link
            to="/login"
            className="landing-nav-link landing-nav-login"
            target="_blank"
            rel="noopener noreferrer"
          >
            Log In
          </Link>
          <Link
            to="/admin/register"
            className="landing-btn landing-btn-primary landing-btn-nav"
            target="_blank"
            rel="noopener noreferrer"
          >
            Set Up Organisation
          </Link>
          <button
            type="button"
            className="landing-nav-toggle"
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div id="landing-mobile-menu" className={`landing-mobile-menu${open ? ' is-open' : ''}`}>
        {LINKS.map((link) => (
          <LandingSectionLink
            key={link.id}
            sectionId={link.id}
            className="landing-mobile-link"
            onNavigate={closeMenu}
          >
            {link.label}
          </LandingSectionLink>
        ))}
        <Link
          to="/login"
          className="landing-mobile-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
        >
          Log In
        </Link>
        <Link
          to="/admin/register"
          className="landing-btn landing-btn-primary landing-btn-block"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
        >
          Set Up Organisation
        </Link>
      </div>
    </header>
  );
}
