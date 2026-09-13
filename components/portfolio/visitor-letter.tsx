'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { AnimatedIcon } from './animated-icon';
import { playUISound } from '@/lib/ui-sounds.js';

const seenKey = 'danila-visitor-letter-seen-v1';
const images = ['/letter/crumpled.png', '/letter/partial.png', '/letter/open.png'];
type Stage = 'hidden' | 'crumpled' | 'partial' | 'open';

export function VisitorLetter() {
  const [stage, setStage] = useState<Stage>('hidden');
  const [mounted, setMounted] = useState(false);
  const [flight, setFlight] = useState({ left: 24, top: 160, x: 0, y: -500, rotation: -160, id: 0 });
  const dialog = useRef<HTMLDialogElement>(null);
  const seen = useRef(false);
  const loaded = useRef<Promise<void>>(Promise.resolve());
  const reduced = useReducedMotion();
  const previousFocus = useRef<HTMLElement | null>(null);
  const show = useCallback(() => {
    seen.current = true;
    try { localStorage.setItem(seenKey, '1'); } catch { /* This visit still remembers it. */ }
    const width = window.visualViewport?.width ?? window.innerWidth;
    const height = window.visualViewport?.height ?? window.innerHeight;
    const size = width <= 600 ? 200 : 240;
    const left = 16 + Math.random() * Math.max(0, width - size - 32);
    const top = (window.visualViewport?.offsetTop ?? 0) + 32 + Math.random() * Math.max(0, height - size - 64);
    const edge = Math.floor(Math.random() * 4);
    const startX = edge === 0 ? -size : edge === 1 ? width + size : Math.random() * width;
    const startY = edge === 2 ? -size : edge === 3 ? height + size : Math.random() * height;
    setFlight(previous => ({ left, top, x: startX - left, y: startY - top, rotation: (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 120), id: previous.id + 1 }));
    setStage('crumpled');
  }, []);

  useEffect(() => {
    if (stage !== 'crumpled') return;
    const timeout = window.setTimeout(() => playUISound('letterImpact'), reduced ? 0 : 850);
    return () => window.clearTimeout(timeout);
  }, [stage, flight.id, reduced]);

  useEffect(() => {
    setMounted(true);
    let alive = true;
    const deadline = Date.now() + 180_000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { seen.current = localStorage.getItem(seenKey) === '1'; } catch { /* Storage is optional. */ }
    loaded.current = Promise.all(images.map(src => new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Letter image failed to load'));
      image.src = src;
    }))).then(() => {});
    // Keep load errors handled even when no letter is requested yet.
    void loaded.current.catch(() => {});
    const arrive = () => {
      if (!alive || seen.current || document.hidden) return;
      if (document.querySelector('dialog[open]')) {
        timer = setTimeout(arrive, 1000);
        return;
      }
      void loaded.current.then(() => {
        if (alive && !seen.current && !document.hidden) show();
      }).catch(() => {});
    };
    const resume = () => {
      clearTimeout(timer);
      if (seen.current) return;
      const remaining = Math.max(0, deadline - Date.now());
      if (remaining === 0) arrive();
      else timer = setTimeout(arrive, remaining);
    };
    const visibility = () => { if (!document.hidden) resume(); };
    const keydown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey || event.metaKey || event.altKey || event.code !== 'KeyL' || event.repeat) return;
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      if (document.querySelector('dialog[open]')) return;
      event.preventDefault();
      clearTimeout(timer);
      void loaded.current.then(() => { if (alive) show(); }).catch(() => {});
    };
    const storage = (event: StorageEvent) => {
      if (event.key === seenKey && event.newValue === '1') { seen.current = true; clearTimeout(timer); }
    };
    resume();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('keydown', keydown);
    window.addEventListener('storage', storage);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('storage', storage);
    };
  }, [show]);

  useEffect(() => {
    if (stage !== 'open') return;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    const padding = document.body.style.paddingRight;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + gutter}px`;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = padding;
      if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
    };
  }, [stage]);

  if (!mounted) return null;
  return createPortal(<>

      {(stage === 'crumpled' || stage === 'partial') && <motion.button
        key={`${flight.id}-${stage}`}
        style={{ left: flight.left, top: flight.top, right: 'auto', bottom: 'auto' }}
        className={`visitor-letter visitor-letter-${stage}`}
        type="button"
        aria-label={stage === 'crumpled' ? 'Развернуть письмо' : 'Прочитать письмо'}
        initial={reduced ? false : stage === 'crumpled' ? { x: flight.x, y: flight.y, rotate: flight.rotation, scale: 0.45 } : { scale: 0.94, rotate: -4 }}
        animate={{ x: 0, y: 0, rotate: stage === 'crumpled' ? 8 : -4, scale: 1 }}
        transition={{ duration: reduced ? 0 : stage === 'crumpled' ? 1 : 0.18, ease: [0.2, 0.7, 0.2, 1] }}
        whileTap={{ scale: 0.97, transition: { duration: 0.15, ease: 'easeOut' } }}
        onClick={() => {
          playUISound('paperRustle');
          if (stage === 'crumpled') setStage('partial');
          else {
            previousFocus.current = document.querySelector('.style-dot-hit[aria-pressed="true"]');
            setStage('open');
          }
        }}>
        <img src={stage === 'crumpled' ? images[0] : images[1]} alt="" draggable={false} />
      </motion.button>}

    {stage === 'open' && <dialog className="visitor-letter-dialog" ref={dialog} aria-label="Письмо от Данилы" onCancel={event => { event.preventDefault(); setStage('hidden'); }} onClick={event => { if (event.target === event.currentTarget) setStage('hidden'); }}>
      <motion.div className="visitor-letter-paper" initial={{ scale: reduced ? 1 : 0.94 }} animate={{ scale: 1 }} transition={{ duration: reduced ? 0 : 0.18, ease: 'easeOut' }}>
        <img src={images[2]} alt="Дорогой читатель! Если ты читаешь эту записку, значит ты провёл на моём сайте некоторое время. Надеюсь тебе понравилось. Буду рад пообщаться с тобой лично, если конечно ты захочешь. Контакты думаю найдёшь. Ещё раз спасибо! Made with love!" />
        <button autoFocus type="button" className="control icon-control visitor-letter-close" aria-label="Закрыть письмо" onClick={() => setStage('hidden')}><AnimatedIcon name="close" size={16} /></button>
      </motion.div>
    </dialog>}
  </>, document.body);
}
