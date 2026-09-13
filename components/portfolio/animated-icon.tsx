'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { PaletteIcon } from '@/components/icons/palette';
import { LinkIcon } from '@/components/icons/link';
import { XIcon } from '@/components/icons/x';
import { SendIcon } from '@/components/icons/send';
import { MailIcon } from '@/components/icons/mail';
import { ChevronLeftIcon } from '@/components/icons/chevron-left';
import { ChevronRightIcon } from '@/components/icons/chevron-right';

type AnimationHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};
const icons = {
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  palette: PaletteIcon,
  link: LinkIcon,
  close: XIcon,
  mail: MailIcon,
  send: SendIcon,
};

export function AnimatedIcon({
  name,
  size = 16,
  className = '',
  trigger = 'hover',
}: {
  name: keyof typeof icons;
  size?: number;
  className?: string;
  trigger?: 'hover' | 'click';
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
    if (trigger === 'click') {
      button.addEventListener('click', start);
      return () => button.removeEventListener('click', start);
    }
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
  }, [reducedMotion, trigger]);
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
