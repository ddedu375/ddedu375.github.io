'use client';

// Adapted from Spell UI Signature; precomputed Caveat 400 outlines.
// See signature-LICENSE.txt for the component and font licenses.
import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import signature from './signature-paths.json';

export function FooterSignature() {
  const maskId = `footer-signature-${useId().replace(/:/g, '')}`;
  const reducedMotion = useReducedMotion();

  return (
    <p className="signature signature-animated" aria-label="made with love">
      <span className="signature-spacer" aria-hidden="true">made with love</span>
      <motion.svg
        className="signature-drawing"
        viewBox={`-0.08 -1.02 ${signature.width + 0.16} 1.4`}
        aria-hidden="true"
        initial="hidden"
        animate={reducedMotion ? 'visible' : undefined}
        whileInView="visible"
        viewport={{ once: true, amount: 0.8 }}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-0.08" y="-1.02" width={signature.width + 0.16} height="1.4">
            {signature.paths.map((d, index) => (
              <motion.path
                key={index}
                d={d}
                fill="none"
                stroke="white"
                strokeWidth={0.22}
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={{ hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }}
                transition={{
                  pathLength: { duration: reducedMotion ? 0 : 0.65, delay: reducedMotion ? 0 : 0.1 + index * 0.12, ease: 'easeInOut' },
                  opacity: { duration: 0, delay: reducedMotion ? 0 : 0.1 + index * 0.12 },
                }}
              />
            ))}
          </mask>
        </defs>
        <g mask={`url(#${maskId})`} fill="currentColor">
          {signature.paths.map((d, index) => <path key={index} d={d} />)}
        </g>
      </motion.svg>
    </p>
  );
}
