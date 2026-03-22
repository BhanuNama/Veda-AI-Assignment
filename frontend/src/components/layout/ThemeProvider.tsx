'use client';

import { useLayoutEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

/**
 * Reads saved theme from localStorage on first mount, applies the correct
 * class to <html>, and syncs the Zustand store.
 *
 * Uses useLayoutEffect (fires before browser paint) to minimise any FOUC.
 * The initRef guard prevents React 18 Strict Mode's double-invocation from
 * toggling the theme back and forth.
 */
export function ThemeProvider() {
  const setTheme = useAppStore((s) => s.setTheme);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const saved = localStorage.getItem('veda-theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved: 'light' | 'dark' = saved ?? (prefersDark ? 'dark' : 'light');

    setTheme(resolved);
  }, [setTheme]);

  return null;
}
