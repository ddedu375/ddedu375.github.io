'use client';

import { useEffect, useRef } from 'react';
import type { AnimationItem } from 'lottie-web';

export function AvitoSticker() {
  const container = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let animation: AnimationItem | undefined;
    let disposed = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      if (reducedMotion.matches) animation?.goToAndStop(0, true);
      else animation?.play();
    };
    void import('lottie-web').then(({ default: lottie }) => {
      if (disposed || !container.current) return;
      animation = lottie.loadAnimation({
        container: container.current,
        renderer: 'svg',
        loop: true,
        autoplay: !reducedMotion.matches,
        path: '/animations/avito-sticker.json',
      });
    });
    reducedMotion.addEventListener('change', syncMotion);
    return () => {
      disposed = true;
      reducedMotion.removeEventListener('change', syncMotion);
      animation?.destroy();
    };
  }, []);

  return <span ref={container} className="avito-sticker" aria-hidden="true" />;
}
