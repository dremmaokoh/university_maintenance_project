import { useLocation, useNavigate } from 'react-router-dom';

export default function LandingSectionLink({ sectionId, className, children, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();

  function scrollToSection() {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleClick(event) {
    event.preventDefault();
    onNavigate?.();
    if (location.pathname === '/') {
      scrollToSection();
      window.history.replaceState(null, '', `#${sectionId}`);
      return;
    }
    navigate('/', { state: { scrollTo: sectionId } });
  }

  return (
    <a href={`/#${sectionId}`} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
