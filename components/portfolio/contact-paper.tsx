'use client';

import { PaperTexture } from '@paper-design/shaders-react';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePaperEraser } from './use-paper-eraser';
import { playUISound } from '@/lib/ui-sounds.js';

export function ContactPaper({ onReveal }: { onReveal: () => void }) {
  const { surface, coating, canReplay, replay } = usePaperEraser(onReveal);
  const [replaying, setReplaying] = useState(false);
  const reducedMotion = useReducedMotion();
  return (
    <div className="paper-note-with-replay">
    <button ref={surface} type="button" className="paper-note paper-note-erasable"
      aria-label="Сотрите бумажку пальцем или с зажатой кнопкой мыши, чтобы открыть стиль. Или нажмите Enter.">
      <div className="paper-note-under" aria-hidden="true">
        <span className="paper-note-label">special for you ♥</span>
      </div>
      <div ref={coating} className="paper-note-cover" aria-hidden="true">
      <div className="paper-note-texture" aria-hidden="true">
        <PaperTexture
          width="100%"
          height="100%"
          colorBack="#ffdcab"
          colorFront="#d3a36b"
          contrast={0.3}
          roughness={0.35}
          fiber={0.3}
          fiberSize={0.2}
          crumples={0.2}
          crumpleSize={0.35}
          folds={0.16}
          foldCount={5}
          drops={0.1}
          fade={0}
          seed={5.8}
          scale={0.6}
          fit="cover"
        />
      </div>
      <span className="paper-note-label">made with love</span>
      </div>
    </button>
    <AnimatePresence>
      {(canReplay || replaying) && <motion.button
        type="button"
        className="paper-replay"
        aria-label="Стереть бумажку заново"
        disabled={replaying}
        initial={{ opacity: 0, x: reducedMotion ? 0 : -40 }}
        animate={{ opacity: 1, x: 0, scale: replaying && !reducedMotion ? 0.97 : 1 }}
        whileTap={{ scale: reducedMotion ? 1 : 0.97 }}
        exit={{ opacity: 0, x: reducedMotion ? 0 : -40 }}
        transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut', scale: { duration: reducedMotion ? 0 : 0.15, ease: 'easeOut' } }}
        onClick={() => { playUISound('click'); setReplaying(true); replay(); }}
      >
        <motion.span
          animate={{ rotate: replaying ? -360 : 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
          onAnimationComplete={() => { if (replaying) setReplaying(false); }}
        ><RotateCcw size={18} strokeWidth={1.5} /></motion.span>
      </motion.button>}
    </AnimatePresence>
    </div>
  );
}
