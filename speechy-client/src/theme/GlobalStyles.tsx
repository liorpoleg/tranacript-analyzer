import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

/*
  FONTS: Download "Baloo 2" and "Plus Jakarta Sans" as woff2 files and place in:
    src/assets/fonts/BaloO2-*.woff2
    src/assets/fonts/PlusJakartaSans-*.woff2
  Then uncomment the @font-face blocks below. No CDN links.
*/
const styles = {
  '@font-face': [],
  '*': { boxSizing: 'border-box' },
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
