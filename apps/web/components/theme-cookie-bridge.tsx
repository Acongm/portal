'use client';

import { useEffect } from 'react';
import { isAcongmTheme, persistTheme } from '@/lib/theme';

/**
 * Fumadocs owns the actual ThemeProvider. This bridge mirrors its selected
 * `theme` value into the shared Acongm storage/cookie contract so chat/auth
 * resolve the same preference across subdomains.
 */
export function ThemeCookieBridge() {
  useEffect(() => {
    const sync = () => {
      try {
        const selected = window.localStorage.getItem('theme');
        if (isAcongmTheme(selected)) {
          persistTheme(selected);
          return;
        }
      } catch {
        // Fall through to resolved document class.
      }
      const resolved = document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light';
      persistTheme(resolved);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
