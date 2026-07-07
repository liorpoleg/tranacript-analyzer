import { useEffect } from 'react';

export function usePageTitle(title: string | null | undefined): void {
  useEffect(() => {
    document.title = title ? `${title} — Speechy` : 'Speechy';
    return () => { document.title = 'Speechy'; };
  }, [title]);
}
