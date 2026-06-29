import { Button, CircularProgress } from '@mui/material';

export default function AppButton({ loading, children, disabled, startIcon, ...props }) {
  return (
    <Button
      disabled={loading || disabled}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      {...props}
    >
      {children}
    </Button>
  );
}
