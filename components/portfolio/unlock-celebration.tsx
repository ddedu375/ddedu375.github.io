'use client';

import { useEffect, useRef } from 'react';
import { LockIcon, type LockIconHandle } from '@/components/icons/lock';
import { playUnlockSound } from '@/lib/unlock-sound';

export function UnlockCelebration() {
  const icon = useRef<LockIconHandle>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const particles: HTMLElement[] = [];
    const unlockDelay = setTimeout(() => icon.current?.startAnimation(), 340);
    let stopSound: (() => void) | undefined;
    const frame = requestAnimationFrame(() => {
      stopSound = playUnlockSound();
      const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff70a6', '#30c9b0'];
      for (let i = 0; i < 48; i++) {
          const direction = i < 24 ? 1 : -1;
          const particle = document.createElement('span');
          particle.className = 'unlock-confetti';
          particle.style.left = direction === 1 ? '-8px' : '100%';
          particle.style.top = `${Math.random() * Math.min(160, window.innerHeight * 0.2)}px`;
          particle.style.background = colors[i % colors.length];
          particle.style.width = `${3 + Math.random() * 3}px`;
          particle.style.height = `${5 + Math.random() * 4}px`;
          document.body.appendChild(particle);
          particles.push(particle);
          const drift = direction * (0.1 + Math.random() * 0.35) * window.innerWidth;
          const fall = window.innerHeight + 40;
          const duration = 2400 + Math.random() * 400;
          const spin = (Math.random() - 0.5) * 900;
          const frames = Array.from({ length: 41 }, (_, index) => {
            const progress = index / 40;
            const x = drift * (1 - (1 - progress) ** 2) + Math.sin(progress * Math.PI * 4) * 12;
            const y = fall * (0.35 * progress + 0.65 * progress * progress);
            return {
              transform: `translate(${x}px, ${y}px) rotate(${spin * progress}deg)`,
              opacity: 1,
              offset: progress,
            };
          });
          particle.animate(frames, { duration, delay: Math.random() * 80, easing: 'linear' }).onfinish = () => particle.remove();
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(unlockDelay);
      stopSound?.();
      particles.forEach((particle) => { particle.getAnimations().forEach((animation) => animation.cancel()); particle.remove(); });
    };
  }, []);
  return <LockIcon ref={icon} className="toast-unlock-icon" size={16} aria-hidden="true" />;
}
