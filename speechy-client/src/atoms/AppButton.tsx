import { Button, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material';

interface AppButtonProps extends ButtonProps {
  loading?: boolean;
  children?: React.ReactNode;
}

export default function AppButton({ loading, children, disabled, startIcon, ...props }: AppButtonProps): JSX.Element {
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
