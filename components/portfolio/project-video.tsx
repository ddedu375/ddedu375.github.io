'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useAnimationControls, useReducedMotion } from 'motion/react';
import { AnimatedIcon } from './animated-icon';

type Bounds = { left: number; top: number; width: number; height: number };
export function ProjectVideo({ source, poster, label }: { source: string; poster: string; label: string }) {
  const inline = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState<Bounds | null>(null);
  const [loadMedia, setLoadMedia] = useState(false);
  const closing = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const controls = useAnimationControls();
  const reduced = useReducedMotion();
  const target = useRef<Bounds>({ left: 0, top: 0, width: 0, height: 0 });
  const restorePage = useRef(() => {});
  useEffect(() => {
    const video = inline.current;
    const container = frame.current;
    if (!video || !container) return;
    let nearby = false;
    const syncPlayback = () => {
      if (document.hidden || (!nearby && !origin)) {
        video.pause();
      } else {
        setLoadMedia(true);
        video.muted = true;
        void video.play().catch(() => {});
      }
    };
    // Keep the decoded video when scrolling back; only defer its first request.
    const observer = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      syncPlayback();
    }, { rootMargin: '200px 0px' });
    observer.observe(container);
    video.addEventListener('canplay', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      observer.disconnect();
      video.removeEventListener('canplay', syncPlayback);
      document.removeEventListener('visibilitychange', syncPlayback);
    };
  }, [origin]);
  const rect = () => {
    const r = frame.current!.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };
  const transform = (r: Bounds) => ({ x: r.left - target.current.left, y: r.top - target.current.top, scaleX: r.width / target.current.width, scaleY: r.height / target.current.height });
  const transition = { duration: reduced ? 0 : 0.24, ease: 'easeOut' as const };
  const close = async () => {
    if (closing.current) return;
    closing.current = true;
    setIsClosing(true);
    await controls.start({ ...transform(rect()), transition });
    if (inline.current && frame.current) {
      frame.current.insertBefore(inline.current, frame.current.firstChild);
      void inline.current.play().catch(() => {});
    }
    dialog.current?.close();
    restorePage.current();
    setOrigin(null);
    trigger.current?.focus({ preventScroll: true });
  };
  useLayoutEffect(() => {
    if (!origin || !inline.current || !host.current) return;
    const video = inline.current;
    const originalFrame = frame.current!;
    const overflow = document.body.style.overflow;
    const padding = document.body.style.paddingRight;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + gutter}px`;
    document.body.style.overflow = 'hidden';
    restorePage.current = () => { document.body.style.overflow = overflow; document.body.style.paddingRight = padding; };
    dialog.current?.showModal();
    host.current.style.setProperty('--video-offset', getComputedStyle(video).transform);
    host.current.insertBefore(video, host.current.firstChild);
    void video.play().catch(() => {});
    controls.set(transform(origin));
    void controls.start({ x: 0, y: 0, scaleX: 1, scaleY: 1, transition });
    return () => {
      originalFrame.insertBefore(video, originalFrame.firstChild);
      restorePage.current();
    };
  }, [origin]);
  return <div className="project-video-frame" ref={frame}>
    <video ref={inline} className="case-media project-video" src={loadMedia ? source : undefined} poster={poster} width={1080} height={1080} autoPlay muted loop playsInline preload="metadata" aria-label={`Видео проекта ${label}`} />
    <button ref={trigger} className="project-video-open" aria-label={`Развернуть видео ${label}`} onClick={() => {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const from = rect();
      const size = Math.min(document.documentElement.clientWidth - 32, window.innerHeight - 48, 1000);
      const height = size * from.height / from.width;
      target.current = { left: (document.documentElement.clientWidth - size) / 2, top: (window.innerHeight - height) / 2, width: size, height };
      closing.current = false;
      setIsClosing(false);
      setOrigin(from);
    }} />
    {origin && createPortal(<dialog ref={dialog} role="dialog" className="project-video-dialog" aria-label={`Видео проекта ${label}`} onCancel={event => { event.preventDefault(); void close(); }}>
      <motion.div className="project-video-backdrop" initial={{ opacity: 0 }} animate={{ opacity: isClosing ? 0 : 1 }} transition={transition} onClick={() => void close()} />
      <motion.div ref={host} className="project-video-expanded" style={{ ...target.current, transformOrigin: 'top left' }} initial={transform(origin)} animate={controls}>
        <button type="button" className="control icon-control project-video-close" aria-label="Закрыть видео" onClick={() => void close()}><AnimatedIcon name="close" size={16} /></button>
      </motion.div>
    </dialog>, document.body)}
  </div>;
}
