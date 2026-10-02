import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2F6277',
      dark: '#234A59',
      light: '#4C8599',
      contrastText: '#fff',
    },
    secondary: {
      main: '#91E9EB',
      dark: '#5FC9CC',
      contrastText: '#234A59',
    },
    background: {
      default: '#E0F7F9',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#5B6B70',
      disabled: '#9BB0B4',
    },
    divider: '#CFEEF0',
    success: { main: '#4E9B6B', light: '#A9DBB8' },
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
          border: '1px solid #CFEEF0',
          boxShadow: '0 1px 3px rgba(47,98,119,0.08)',
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
            color: '#5B6B70',
            background: '#EAF9FA',
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
