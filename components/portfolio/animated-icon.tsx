'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { PaletteIcon } from '@/components/icons/palette';
import { LinkIcon } from '@/components/icons/link';
import { XIcon } from '@/components/icons/x';
import { MailIcon } from '@/components/icons/mail';

type AnimationHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};
const icons = {
  palette: PaletteIcon,
  link: LinkIcon,
  close: XIcon,
  mail: MailIcon,
};

export function AnimatedIcon({
  name,
  size = 16,
  className = '',
}: {
  name: keyof typeof icons;
  size?: number;
  className?: string;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const handle = useRef<AnimationHandle>(null);
  const reducedMotion = useReducedMotion();
  const Icon = icons[name];
  useEffect(() => {
    const button = host.current?.closest('button, a');
    if (!button) return;
    if (reducedMotion) {
      handle.current?.stopAnimation();
      return;
    }
    const start = () => {
      if (button.matches(':disabled,[aria-disabled="true"]')) return;
      handle.current?.startAnimation();
    };
    const stop = () => handle.current?.stopAnimation();
    const focus = () => {
      if (button.matches(':focus-visible')) start();
    };
    button.addEventListener('mouseenter', start);
    button.addEventListener('mouseleave', stop);
    button.addEventListener('focusin', focus);
    button.addEventListener('focusout', stop);
    return () => {
      button.removeEventListener('mouseenter', start);
      button.removeEventListener('mouseleave', stop);
      button.removeEventListener('focusin', focus);
      button.removeEventListener('focusout', stop);
    };
  }, [reducedMotion]);
  return (
    <span
      ref={host}
      className={`animated-icon ${className}`}
      aria-hidden="true"
    >
      <Icon ref={handle} size={size} />
    </span>
  );
}
