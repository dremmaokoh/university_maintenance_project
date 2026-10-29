import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const INACTIVITY_MS = 10 * 60 * 1000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click', 'wheel'];

function loginPathForUser(user) {
  if (user?.role === 'student' && user?.organisation?.slug) {
    return `/o/${user.organisation.slug}/login`;
  }
  return '/login';
}

export default function InactivityLogout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let timeoutId;

    function signOutForInactivity() {
      const currentUser = userRef.current;
      const path = loginPathForUser(currentUser);
      logout();
      showSuccess('Signed out after 10 minutes of inactivity.');
      navigate(path, { replace: true });
    }

    function resetTimer() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(signOutForInactivity, INACTIVITY_MS);
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });
    document.addEventListener('scroll', resetTimer, { capture: true, passive: true });
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
      document.removeEventListener('scroll', resetTimer, { capture: true });
    };
  }, [user, logout, navigate, showSuccess]);

  return null;
}
