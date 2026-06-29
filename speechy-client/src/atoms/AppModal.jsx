import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import { X } from '@phosphor-icons/react';

export default function AppModal({ open, onClose, title, children, onConfirm, confirmLabel = 'Confirm', confirmColor = 'primary', loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {onConfirm && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={onConfirm} variant="contained" color={confirmColor} disabled={loading}>
            {loading ? 'Loading…' : confirmLabel}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
