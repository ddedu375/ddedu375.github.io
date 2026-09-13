'use client';

import { useEffect, useRef } from 'react';
import type { AnimationItem } from 'lottie-web';

export function AvitoSticker({ path = '/animations/avito-sticker.json', size = 16 }: { path?: string; size?: number }) {
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
        path,
      });
    });
    reducedMotion.addEventListener('change', syncMotion);
    return () => {
      disposed = true;
      reducedMotion.removeEventListener('change', syncMotion);
      animation?.destroy();
    };
  }, [path]);

  return <span ref={container} className="avito-sticker" style={{ width: size, height: size, flexBasis: size }} aria-hidden="true" />;
}
