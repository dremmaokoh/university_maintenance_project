import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TOAST_DURATION_MS = 5000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (type, message) => {
      const text = String(message || '').trim();
      if (!text) {
        return;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, message: text }]);
      const timer = setTimeout(() => removeToast(id), TOAST_DURATION_MS);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const showError = useCallback(
    (message) => pushToast('error', message),
    [pushToast]
  );
  const showSuccess = useCallback(
    (message) => pushToast('success', message),
    [pushToast]
  );

  const value = useMemo(
    () => ({ showError, showSuccess }),
    [showError, showSuccess]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`} role="alert">
            <p className="toast__message">{toast.message}</p>
            <button
              type="button"
              className="toast__close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
