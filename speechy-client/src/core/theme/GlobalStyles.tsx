import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

/*
  FONTS: Download "Baloo 2" and "Plus Jakarta Sans" as woff2 files and place in:
    src/assets/fonts/BaloO2-*.woff2
    src/assets/fonts/PlusJakartaSans-*.woff2
  Then uncomment the @font-face blocks below. No CDN links.
*/
// Mirrors src/theme/index.ts palette/shape tokens as CSS custom properties so
// CSS Modules (which can't read the JS theme object) can stay in sync with it.
// Keep these two files in sync by hand — there is no single source of truth.
const styles = {
  '@font-face': [],
  ':root': {
    '--color-primary': '#2196f3',
    '--color-primary-dark': '#1565c0',
    '--color-primary-light': '#64b5f6',
    '--color-secondary': '#0288d1',
    '--color-bg-default': '#f4f6fb',
    '--color-bg-paper': '#ffffff',
    '--color-bg-sidebar': '#eaf3fd',
    '--color-text-primary': '#191c24',
    '--color-text-secondary': '#5f6675',
    '--color-text-disabled': '#9aa1ae',
    '--color-divider': '#e3e6ec',
    '--color-success': '#22c55e',
    '--color-warning': '#f59e0b',
    '--color-error': '#ef4444',
    '--radius-base': '12px',
    '--radius-card': '16px',
    '--radius-control': '10px',
    '--radius-pill': '999px',
    '--spacing-unit': '8px',
  },
  '*': { boxSizing: 'border-box' },
  // Reserve the scrollbar's width permanently so content that grows past the
  // viewport height (e.g. expanding a table row) doesn't shift the whole
  // page horizontally when the scrollbar appears.
  html: { overflowY: 'scroll' },
  '::-webkit-scrollbar': { width: 8, height: 8 },
  '::-webkit-scrollbar-thumb': {
    background: 'rgba(130,130,140,0.32)',
    borderRadius: 8,
    border: '2px solid transparent',
    backgroundClip: 'content-box',
  },
  '::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(130,130,140,0.5)',
    backgroundClip: 'content-box',
  },
};

export default function GlobalStyles(): JSX.Element {
  return <MuiGlobalStyles styles={styles} />;
}
