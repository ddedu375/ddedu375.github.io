'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { AnimatedIcon } from './animated-icon';
import { playUISound } from '@/lib/ui-sounds.js';

const seenKey = 'danila-visitor-letter-seen-v1';
const deadlineKey = 'danila-visitor-letter-deadline-v1';
const activeKey = 'danila-visitor-letter-active-v1';
const images = ['/letter/crumpled.png', '/letter/partial.png', '/letter/open.png'];
type Stage = 'hidden' | 'crumpled' | 'partial' | 'open';
type Flight = { left: number; top: number; x: number; y: number; rotation: number; id: number };
type SavedLetter = { path: string; stage: Exclude<Stage, 'hidden'>; flight: Flight };
function saveLetter(value: SavedLetter | null) {
  try {
    if (value) sessionStorage.setItem(activeKey, JSON.stringify(value));
    else sessionStorage.removeItem(activeKey);
  } catch { /* Storage is optional. */ }
}

export function VisitorLetter() {
  const pathname = usePathname();
  const [stage, setStage] = useState<Stage>('hidden');
  const [ownerPath, setOwnerPath] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
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
    const nextFlight = { left, top, x: startX - left, y: startY - top, rotation: (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 120), id: Date.now() };
    saveLetter({ path: pathname, stage: 'crumpled', flight: nextFlight });
    setOwnerPath(pathname);
    setRestored(false);
    setFlight(nextFlight);
    setStage('crumpled');
  }, [pathname]);

  const changeStage = (next: Stage) => {
    saveLetter(next === 'hidden' ? null : { path: pathname, stage: next, flight });
    setRestored(false);
    setStage(next);
  };

  useEffect(() => {
    if (stage !== 'crumpled' || restored || ownerPath !== pathname) return;
    const timeout = window.setTimeout(() => playUISound('letterImpact'), reduced ? 0 : 850);
    return () => window.clearTimeout(timeout);
  }, [stage, flight.id, reduced, restored, ownerPath, pathname]);

  useEffect(() => {
    setMounted(true);
    setStage('hidden');
    let alive = true;
    let deadline = Date.now() + 180_000;
    try {
      const savedDeadline = Number(sessionStorage.getItem(deadlineKey));
      if (Number.isFinite(savedDeadline) && savedDeadline > 0) deadline = savedDeadline;
      else sessionStorage.setItem(deadlineKey, String(deadline));
    } catch { /* Without storage, keep the timer for the current page. */ }
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
    try {
      const saved = JSON.parse(sessionStorage.getItem(activeKey) ?? 'null') as SavedLetter | null;
      if (saved?.path === pathname && ['crumpled', 'partial', 'open'].includes(saved.stage) &&
          saved.flight && Object.values(saved.flight).length === 6 && Object.values(saved.flight).every(Number.isFinite)) {
        seen.current = true;
        void loaded.current.then(() => {
          if (!alive) return;
          setOwnerPath(pathname);
          setFlight(saved.flight);
          setRestored(true);
          setStage(saved.stage === 'open' ? 'partial' : saved.stage);
        }).catch(() => {});
      }
    } catch { /* Ignore an invalid or unavailable saved letter. */ }
    const arrive = () => {
      if (!alive || seen.current || document.hidden) return;
      if (document.querySelector('dialog[open]')) {
        timer = setTimeout(arrive, 1000);
        return;
      }
      void loaded.current.then(() => {
        try { if (localStorage.getItem(seenKey) === '1') seen.current = true; } catch { /* Storage is optional. */ }
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
  }, [show, pathname]);

  useEffect(() => {
    if (stage !== 'open' || ownerPath !== pathname) return;
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
  }, [stage, ownerPath, pathname]);

  if (!mounted || ownerPath !== pathname) return null;
  return createPortal(<>

      {(stage === 'crumpled' || stage === 'partial') && <motion.button
        key={`${flight.id}-${stage}`}
        style={{ left: flight.left, top: flight.top, right: 'auto', bottom: 'auto' }}
        className={`visitor-letter visitor-letter-${stage}`}
        type="button"
        aria-label={stage === 'crumpled' ? 'Развернуть письмо' : 'Прочитать письмо'}
        initial={reduced || restored ? false : stage === 'crumpled' ? { x: flight.x, y: flight.y, rotate: flight.rotation, scale: 0.45 } : { scale: 0.94, rotate: -4 }}
        animate={{ x: 0, y: 0, rotate: stage === 'crumpled' ? 8 : -4, scale: 1 }}
        transition={{ duration: reduced ? 0 : stage === 'crumpled' ? 1 : 0.18, ease: [0.2, 0.7, 0.2, 1] }}
        whileTap={{ scale: 0.97, transition: { duration: 0.15, ease: 'easeOut' } }}
        onClick={() => {
          playUISound('paperRustle');
          if (stage === 'crumpled') changeStage('partial');
          else {
            previousFocus.current = document.querySelector('.style-dot-hit[aria-pressed="true"]');
            changeStage('open');
          }
        }}>
        <img src={stage === 'crumpled' ? images[0] : images[1]} alt="" draggable={false} />
      </motion.button>}

    {stage === 'open' && <dialog className="visitor-letter-dialog" ref={dialog} aria-label="Письмо от Данилы" onCancel={event => { event.preventDefault(); changeStage('hidden'); }} onClick={event => { if (event.target === event.currentTarget) changeStage('hidden'); }}>
      <motion.div className="visitor-letter-paper" initial={{ scale: reduced ? 1 : 0.94 }} animate={{ scale: 1 }} transition={{ duration: reduced ? 0 : 0.18, ease: 'easeOut' }}>
        <img src={images[2]} alt="Дорогой читатель! Если ты читаешь эту записку, значит ты провёл на моём сайте некоторое время. Надеюсь тебе понравилось. Буду рад пообщаться с тобой лично, если конечно ты захочешь. Контакты думаю найдёшь. Ещё раз спасибо! Made with love!" />
        <button autoFocus type="button" className="control icon-control visitor-letter-close" aria-label="Закрыть письмо" onClick={() => changeStage('hidden')}><AnimatedIcon name="close" size={16} /></button>
      </motion.div>
    </dialog>}
  </>, document.body);
}
