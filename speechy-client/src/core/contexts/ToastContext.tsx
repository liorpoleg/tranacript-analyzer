import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { ToastSeverity } from '@/core/types';

interface Toast {
  key: number;
  message: string;
  severity: ToastSeverity;
  open: boolean;
}

interface ToastContextValue {
  show: (message: string, severity?: ToastSeverity) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Errors stay a bit longer than routine success/info toasts since there's
// more to read, but everything auto-dismisses — nothing should pile up.
const AUTO_HIDE_MS: Record<ToastSeverity, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

let id = 0;

export function useToast(): ToastContextValue {
  return useContext(ToastContext) as ToastContextValue;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, severity: ToastSeverity = 'info') => {
    const key = ++id;
    setToasts((prev) => [...prev, { key, message, severity, open: true }]);
  }, []);

  const close = useCallback((key: number) => {
    setToasts((prev) => prev.filter((t) => t.key !== key));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toasts.map((t) => (
        <Snackbar
          key={t.key}
          open={t.open}
          autoHideDuration={AUTO_HIDE_MS[t.severity] ?? 4000}
          onClose={(_event, reason) => {
            if (reason === 'clickaway') return;
            close(t.key);
          }}
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
