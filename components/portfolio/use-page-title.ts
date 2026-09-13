'use client';

import { useLayoutEffect } from 'react';
import { profile } from '@/lib/portfolio';

export function usePageTitle(label: string) {
  useLayoutEffect(() => {
    let frame = 0;
    const write = (prefix: string) => {
      const title = prefix ? `${prefix} — ${profile.name}` : profile.name;
      if (document.title !== title) document.title = title;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) {
      write(label);
      return;
    }
    const incoming = Array.from(label);
    const started = performance.now();
    write('');
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 730);
      const count = Math.floor(incoming.length * (1 - (1 - progress) ** 3));
      write(incoming.slice(incoming.length - count).join(''));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else write(label);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      write(label);
    };
    frame = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [label]);
}
