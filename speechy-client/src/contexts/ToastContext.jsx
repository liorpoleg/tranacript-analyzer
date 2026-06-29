import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext(null);

let id = 0;

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, severity = 'info') => {
    const key = ++id;
    setToasts((prev) => [...prev, { key, message, severity, open: true }]);
    if (severity !== 'error') {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.key !== key));
      }, 4000);
    }
  }, []);

  const close = useCallback((key) => {
    setToasts((prev) => prev.filter((t) => t.key !== key));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toasts.map((t) => (
        <Snackbar
          key={t.key}
          open={t.open}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: toasts.indexOf(t) * 8 }}
        >
          <Alert
            severity={t.severity}
            onClose={() => close(t.key)}
            sx={{ minWidth: 300, boxShadow: 4 }}
          >
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}
