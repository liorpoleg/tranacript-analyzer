import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — Speechy` : 'Speechy';
    return () => { document.title = 'Speechy'; };
  }, [title]);
}
