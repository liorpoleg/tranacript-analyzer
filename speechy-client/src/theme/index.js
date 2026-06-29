import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
      dark: '#1565c0',
      light: '#64b5f6',
      contrastText: '#fff',
    },
    secondary: {
      main: '#0288d1',
    },
    background: {
      default: '#f4f6fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#191c24',
      secondary: '#5f6675',
      disabled: '#9aa1ae',
    },
    divider: '#e3e6ec',
    success: { main: '#22c55e' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    h1: {
      fontFamily: '"Baloo 2", "Plus Jakarta Sans", sans-serif',
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: '"Baloo 2", "Plus Jakarta Sans", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Baloo 2", "Plus Jakarta Sans", sans-serif',
      fontWeight: 700,
    },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e3e6ec',
          boxShadow: '0 1px 3px rgba(20,23,33,0.06)',
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 99 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#9aa1ae',
            background: '#eceef3',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
});

export default theme;
