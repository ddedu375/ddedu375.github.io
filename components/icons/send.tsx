'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { motion, useAnimation, type Variants } from 'motion/react';

// Lucide Send geometry; match the Mail icon's line-drawing animation.
const LINE_VARIANTS: Variants = {
  normal: { pathLength: 1, opacity: 1, transition: { duration: 0.216 } },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      pathLength: { duration: 0.288, ease: 'easeInOut' },
      opacity: { duration: 0.288, ease: 'easeInOut' },
    },
  },
};
type SendHandle = { startAnimation: () => void; stopAnimation: () => void };

export const SendIcon = forwardRef<SendHandle, { size?: number }>(function SendIcon({ size = 16 }, ref) {
  const controls = useAnimation();
  useImperativeHandle(ref, () => ({
    startAnimation: () => { void controls.start('animate'); },
    stopAnimation: () => { void controls.start('normal'); },
  }), [controls]);
  return (
    <span style={{ display: 'inline-flex' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
        <motion.path d="m21.854 2.147-10.94 10.939" initial="normal" animate={controls} variants={LINE_VARIANTS} />
      </svg>
    </span>
  );
});
