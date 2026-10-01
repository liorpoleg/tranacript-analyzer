import { GlobalStyles as MuiGlobalStyles } from '@mui/material';
import baloo2_700 from '@/assets/fonts/Baloo2-700.woff2';
import baloo2_800 from '@/assets/fonts/Baloo2-800.woff2';
import jakarta_400 from '@/assets/fonts/PlusJakartaSans-400.woff2';
import jakarta_500 from '@/assets/fonts/PlusJakartaSans-500.woff2';
import jakarta_600 from '@/assets/fonts/PlusJakartaSans-600.woff2';
import jakarta_700 from '@/assets/fonts/PlusJakartaSans-700.woff2';

// Mirrors src/theme/index.ts palette/shape tokens as CSS custom properties so
// CSS Modules (which can't read the JS theme object) can stay in sync with it.
// Keep these two files in sync by hand — there is no single source of truth.
const styles = {
  '@font-face': [
    { fontFamily: 'Baloo 2', fontStyle: 'normal', fontWeight: 700, fontDisplay: 'swap', src: `url(${baloo2_700}) format('woff2')` },
    { fontFamily: 'Baloo 2', fontStyle: 'normal', fontWeight: 800, fontDisplay: 'swap', src: `url(${baloo2_800}) format('woff2')` },
    { fontFamily: 'Plus Jakarta Sans', fontStyle: 'normal', fontWeight: 400, fontDisplay: 'swap', src: `url(${jakarta_400}) format('woff2')` },
    { fontFamily: 'Plus Jakarta Sans', fontStyle: 'normal', fontWeight: 500, fontDisplay: 'swap', src: `url(${jakarta_500}) format('woff2')` },
    { fontFamily: 'Plus Jakarta Sans', fontStyle: 'normal', fontWeight: 600, fontDisplay: 'swap', src: `url(${jakarta_600}) format('woff2')` },
    { fontFamily: 'Plus Jakarta Sans', fontStyle: 'normal', fontWeight: 700, fontDisplay: 'swap', src: `url(${jakarta_700}) format('woff2')` },
  ],
  ':root': {
    '--color-primary': '#2F6277',
    '--color-primary-dark': '#234A59',
    '--color-primary-light': '#4C8599',
    '--color-secondary': '#91E9EB',
    '--color-bg-default': '#E0F7F9',
    '--color-bg-paper': '#ffffff',
    '--color-bg-sidebar': '#EAF9FA',
    '--color-text-primary': '#333333',
    '--color-text-secondary': '#5B6B70',
    '--color-text-disabled': '#9BB0B4',
    '--color-divider': '#CFEEF0',
    '--color-success': '#4E9B6B',
    '--color-success-soft': '#A9DBB8',
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
