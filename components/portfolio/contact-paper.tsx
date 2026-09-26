'use client';

import { PaperTexture } from '@paper-design/shaders-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePaperEraser } from './use-paper-eraser';
import { preferenceKey, readPreferences } from '@/lib/portfolio';
import { playUISound } from '@/lib/ui-sounds.js';

export function ContactPaper({ onReveal }: { onReveal: () => void }) {
  const [hintEligible, setHintEligible] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [debugHint, setDebugHint] = useState(false);
  const scratchRecorded = useRef(false);
  const dismissHint = useCallback(() => {
    if (scratchRecorded.current) return;
    scratchRecorded.current = true;
    setHintEligible(false);
    setDebugHint(false);
    try { localStorage.setItem('portfolio-scratch-learned-v1', '1'); } catch {}
  }, []);
  const { surface, coating, canReplay, replay } = usePaperEraser(onReveal, dismissHint);
  useEffect(() => {
    try {
      const alreadyUnlocked = readPreferences(localStorage.getItem(preferenceKey)).unlocked.includes('character-3');
      setHintEligible(!alreadyUnlocked && localStorage.getItem('portfolio-scratch-learned-v1') !== '1');
    } catch { setHintEligible(true); }
    const media = window.matchMedia('(hover: none) and (pointer: coarse)');
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.8) return;
      setHintVisible(true);
      observer.disconnect();
    }, { threshold: 0.8 });
    if (surface.current) observer.observe(surface.current);
    return () => { observer.disconnect(); media.removeEventListener('change', sync); };
  }, [surface]);
  useEffect(() => {
    const debug = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey || event.metaKey || event.altKey || event.repeat || event.code !== 'KeyE') return;
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      replay(true);
      scratchRecorded.current = false;
      setHintEligible(true);
      setDebugHint(true);
      surface.current?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    };
    window.addEventListener('keydown', debug);
    return () => window.removeEventListener('keydown', debug);
  }, [replay, surface]);
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
      {hintEligible && hintVisible && (mobile || debugHint) && <motion.div
        key="scratch-hint"
        className="paper-scratch-hint"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' } }}
        transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
      >
        <span>Попробуй<br />стереть</span>
      </motion.div>}
    </AnimatePresence>
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
