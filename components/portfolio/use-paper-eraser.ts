'use client';

import { useEffect, useRef, useState } from 'react';
import { createScratchSound } from '@/lib/scratch-sound';

type Point = { x: number; y: number };

export function usePaperEraser(onReveal: () => void, onScratch?: () => void) {
  const [canReplay, setCanReplay] = useState(false);
  const restore = useRef<(quiet?: boolean) => void>(() => {});
  const surface = useRef<HTMLButtonElement>(null);
  const coating = useRef<HTMLDivElement>(null);
  const scratchCallback = useRef(onScratch);
  useEffect(() => { scratchCallback.current = onScratch; }, [onScratch]);
  const revealCallback = useRef(onReveal);
  useEffect(() => { revealCallback.current = onReveal; }, [onReveal]);

  useEffect(() => {
    const area = surface.current;
    const layer = coating.current;
    if (!area || !layer) return;
    const mask = document.createElement('canvas');
    const context = mask.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const sound = createScratchSound();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const particles = new Set<HTMLElement>();
    let erasing = false;
    let previous: Point | null = null;
    let pending: PointerEvent | null = null;
    let frame = 0;
    let lastParticle = 0;
    let revealed = false;
    let unlocked = false;
    let disposed = false;
    let maskRevision = 0;
    let maskInitialized = false;

    const checkProgress = () => {
      const pixels = context.getImageData(0, 0, mask.width, mask.height).data;
      let remaining = 0;
      for (let i = 3; i < pixels.length; i += 4) remaining += pixels[i] / 255;
      setCanReplay(remaining <= mask.width * mask.height * 0.2);
      if (!unlocked && remaining <= mask.width * mask.height * 0.3) {
        unlocked = true;
        revealCallback.current();
      }
    };
    const paintMask = (fadeIn = false) => {
      const revision = ++maskRevision;
      const image = new Image();
      image.src = mask.toDataURL();
      // Keep the old, decoded mask visible until the next one is ready.
      void image.decode().then(() => {
        if (disposed || revision !== maskRevision) return;

        const url = `url("${image.src}")`;
        layer.style.setProperty('-webkit-mask-image', url);
        layer.style.maskImage = url;
        if (fadeIn && !reduced.matches) {
          layer.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 180,
            easing: 'ease-out',
          });
        }
      }).catch(() => {});
    };
    const resize = () => {
      const width = area.clientWidth;
      const height = area.clientHeight;
      if (!width || !height || (mask.width === width && mask.height === height)) return;
      const saved = document.createElement('canvas');
      saved.width = mask.width; saved.height = mask.height;
      saved.getContext('2d')?.drawImage(mask, 0, 0);
      const hadMask = maskInitialized;
      mask.width = width; mask.height = height;
      if (hadMask) context.drawImage(saved, 0, 0, width, height);
      else { context.fillStyle = '#fff'; context.fillRect(0, 0, width, height); }
      maskInitialized = true;
      previous = null;
      paintMask();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(area);
    resize();

    const emitParticles = (event: PointerEvent) => {
      if (reduced.matches || performance.now() - lastParticle < 40) return;
      lastParticle = performance.now();
      for (let i = 0; i < 3; i++) {
        const particle = document.createElement('span');
        particle.className = 'paper-eraser-particle';
        particle.style.left = `${event.clientX}px`;
        particle.style.top = `${event.clientY}px`;
        particle.style.width = `${1.5 + Math.random() * 1.5}px`;
        particle.style.height = `${2.5 + Math.random() * 1.5}px`;
        document.body.appendChild(particle);
        particles.add(particle);
        const vx = (Math.random() - 0.5) * 150;
        const vy = -65 - Math.random() * 55;
        const fallDistance = Math.max(0, window.innerHeight - event.clientY) + 32;
        // End only after the flake has fallen below the viewport.
        const duration = ((-vy + Math.sqrt(vy * vy + 480 * fallDistance)) / 240) * 1000;
        const rotation = (Math.random() - 0.5) * 300;
        const keyframes = Array.from({ length: 33 }, (_, index) => {
          const progress = index / 32;
          const time = progress * duration / 1000;
          const x = vx * time;
          const y = vy * time + 120 * time * time;
          return {
            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotation * progress}deg)`,
            opacity: 1,
            offset: progress,
          };
        });
        const animation = particle.animate(keyframes, { duration, easing: 'linear' });
        animation.onfinish = () => { particle.remove(); particles.delete(particle); };
      }
    };

    const erase = () => {
      frame = 0;
      const event = pending;
      pending = null;
      if (!event || revealed) return;
      const rect = area.getBoundingClientRect();
      const point = { x: (event.clientX - rect.left) * mask.width / rect.width, y: (event.clientY - rect.top) * mask.height / rect.height };
      const start = previous ?? point;
      const distance = Math.hypot(point.x - start.x, point.y - start.y);
      const pixels = context.getImageData(0, 0, mask.width, mask.height).data;
      let fresh = false;
      const steps = Math.max(1, Math.ceil(distance / 8));
      for (let i = 0; i <= steps && !fresh; i++) {
        const x = start.x + (point.x - start.x) * i / steps;
        const y = start.y + (point.y - start.y) * i / steps;
        for (const [dx, dy] of [[0, 0], [9, 0], [-9, 0], [0, 9], [0, -9]]) {
          const sx = Math.round(x + dx), sy = Math.round(y + dy);
          if (sx >= 0 && sx < mask.width && sy >= 0 && sy < mask.height && pixels[(sy * mask.width + sx) * 4 + 3] > 10) fresh = true;
        }
      }
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = 28;
      context.lineCap = 'round';
      context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(point.x, point.y); context.stroke();
      context.beginPath(); context.arc(point.x, point.y, 14, 0, Math.PI * 2); context.fill();
      context.globalCompositeOperation = 'source-over';
      previous = point;
      paintMask();
      if (fresh) {
        scratchCallback.current?.();
        checkProgress();
        if (!reduced.matches) sound.play();
        emitParticles(event);
      }
    };
    const move = (event: PointerEvent) => {
      if (!erasing || (event.buttons & 1) === 0) return;
      event.preventDefault();
      pending = event;
      if (!frame) frame = requestAnimationFrame(erase);
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      erasing = true;
      document.body.classList.add('paper-erasing');
      window.getSelection()?.removeAllRanges();
      previous = null;
      area.setPointerCapture(event.pointerId);
      move(event);
    };
    const reset = () => {
      erasing = false;
      document.body.classList.remove('paper-erasing');
      if (frame) cancelAnimationFrame(frame);
      frame = 0; pending = null; previous = null;
    };
    restore.current = (quiet = false) => {
      reset();
      revealed = false;
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = '#fff';
      context.fillRect(0, 0, mask.width, mask.height);
      paintMask(!quiet);
      setCanReplay(false);
      area.setAttribute('aria-label', 'Сотрите бумажку пальцем или с зажатой кнопкой мыши, чтобы открыть стиль. Или нажмите Enter.');
      if (!quiet) area.focus({ preventScroll: true });
      else if (document.activeElement === area) area.blur();
    };
    const reveal = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      scratchCallback.current?.();
      context.clearRect(0, 0, mask.width, mask.height);
      paintMask();
      revealed = true;
      checkProgress();
      area.setAttribute('aria-label', 'special for you, сердечко');
    };
    const preventSelection = (event: Event) => { if (erasing) event.preventDefault(); };
    const onVisibility = () => { if (document.hidden) reset(); };
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', reset);
    area.addEventListener('lostpointercapture', reset);
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerdown', down);
    area.addEventListener('pointerleave', reset);
    area.addEventListener('pointerup', reset);
    area.addEventListener('pointercancel', reset);
    area.addEventListener('keydown', reveal);
    return () => {
      disposed = true;
      restore.current = () => {};
      reset(); observer.disconnect(); sound.dispose();
      particles.forEach((particle) => particle.remove());
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', reset);
      area.removeEventListener('lostpointercapture', reset);
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerdown', down);
      area.removeEventListener('pointerleave', reset);
      area.removeEventListener('pointerup', reset);
      area.removeEventListener('pointercancel', reset);
      area.removeEventListener('keydown', reveal);
    };
  }, []);
  return { surface, coating, canReplay, replay: (quiet = false) => restore.current(quiet) };
}
