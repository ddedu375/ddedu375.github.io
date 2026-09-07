'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Sun, Moon } from 'lucide';
import { MorphIcon } from 'morphicons/react';
import { SunIcon, type SunIconHandle } from '@/components/icons/sun';
import { MoonIcon, type MoonIconHandle } from '@/components/icons/moon';

export function ThemeIcon({ theme }: { theme: 'light' | 'dark' }) {
  const host = useRef<HTMLSpanElement>(null);
  const sun = useRef<SunIconHandle>(null);
  const moon = useRef<MoonIconHandle>(null);
  const [hovering, setHovering] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const button = host.current?.closest('button');
    if (!button) return;
    const start = () => {
      if (reducedMotion) return;
      setHovering(true);
      (theme === 'light' ? sun : moon).current?.startAnimation();
    };
    const stop = () => {
      setHovering(false);
      sun.current?.stopAnimation();
      moon.current?.stopAnimation();
    };
    const focus = () => { if (button.matches(':focus-visible')) start(); };
    button.addEventListener('mouseenter', start);
    button.addEventListener('mouseleave', stop);
    button.addEventListener('focusin', focus);
    button.addEventListener('focusout', stop);
    button.addEventListener('click', stop, true);
    return () => {
      button.removeEventListener('mouseenter', start);
      button.removeEventListener('mouseleave', stop);
      button.removeEventListener('focusin', focus);
      button.removeEventListener('focusout', stop);
      button.removeEventListener('click', stop, true);
    };
  }, [theme, reducedMotion]);

  const showHover = hovering && !reducedMotion;
  return (
    <span ref={host} className="theme-icon" aria-hidden="true">
      <span style={{ visibility: showHover ? 'hidden' : 'visible' }}>
        <MorphIcon icon={theme === 'light' ? Sun : Moon} size={16}
          spring={{ stiffness: 680, damping: 52 }} reducedMotion="user" />
      </span>
      <span className="theme-icon-hover" style={{ visibility: showHover && theme === 'light' ? 'visible' : 'hidden' }}>
        <SunIcon ref={sun} size={16} />
      </span>
      <span className="theme-icon-hover" style={{ visibility: showHover && theme === 'dark' ? 'visible' : 'hidden' }}>
        <MoonIcon ref={moon} size={16} />
      </span>
    </span>
  );
}
