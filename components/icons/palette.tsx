// Adapted from lucide-animated.com (MIT). See LICENSE and README.md in this directory.
'use client';

import type { Variants } from 'motion/react';
import { motion, stagger, useAnimation } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface PaletteIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface PaletteIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DASH_LENGTH = 70;
const DRAW_DURATION = 0.324;
const DOT_STAGGER = 0.0576;

const DOTS = [
  { cx: 6.5, cy: 12.5 },
  { cx: 8.5, cy: 7.5 },
  { cx: 13.5, cy: 6.5 },
  { cx: 17.5, cy: 10.5 },
];

const OUTLINE_VARIANTS: Variants = {
  normal: {
    strokeDashoffset: 0,
  },
  animate: {
    strokeDashoffset: [DASH_LENGTH, 0],
    transition: {
      duration: DRAW_DURATION,
      ease: [0.65, 0, 0.35, 1],
    },
  },
};

const DOTS_GROUP_VARIANTS: Variants = {
  normal: {},
  animate: {
    transition: {
      delayChildren: stagger(DOT_STAGGER, { startDelay: DRAW_DURATION }),
    },
  },
};

const DOT_VARIANTS: Variants = {
  normal: {
    scale: 1,
    transition: { duration: 0.144 },
  },
  animate: {
    // Two keyframes only: motion rejects 3+ keyframes on a spring.
    scale: [0, 1],
    transition: {
      damping: 13.888889,
      stiffness: 578.703704,
      type: 'spring',
    },
  },
};

const PaletteIcon = forwardRef<PaletteIconHandle, PaletteIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);
    const isAnimatingRef = useRef(false);

    const startAnimation = async () => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      try {
        await controls.start('animate');
      } finally {
        isAnimatingRef.current = false;
      }
    };

    const stopAnimation = useCallback(async () => {
      isAnimatingRef.current = false;
      await controls.start('normal');
    }, [controls]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return { startAnimation, stopAnimation };
    });

    const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          void startAnimation();
        }
      };

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          void stopAnimation();
        }
      },
      [stopAnimation, onMouseLeave],
    );

    return (
      <span
        className={cn('inline-flex items-center justify-center', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            animate={controls}
            d="M12 2a1 1 0 0 0 0 20l.25 0a1.75 1.75 0 0 0 1.4-2.8l-.3-.4a1.75 1.75 0 0 1 1.4-2.8h2.25a5 5 0 0 0 5-5 10 9 0 0 0-10-9z"
            initial="normal"
            strokeDasharray={DASH_LENGTH}
            variants={OUTLINE_VARIANTS}
          />
          <motion.g
            animate={controls}
            initial="normal"
            variants={DOTS_GROUP_VARIANTS}
          >
            {DOTS.map((dot) => (
              <motion.circle
                cx={dot.cx}
                cy={dot.cy}
                fill="currentColor"
                key={`${dot.cx}-${dot.cy}`}
                r=".5"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                variants={DOT_VARIANTS}
              />
            ))}
          </motion.g>
        </svg>
      </span>
    );
  },
);

PaletteIcon.displayName = 'PaletteIcon';

export { PaletteIcon };
