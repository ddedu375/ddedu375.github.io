'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import { AnimatedIcon } from './animated-icon';
import { AnimatePresence, animate, motion, useAnimationControls, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { AvitoSticker } from './avito-sticker';
import { ProjectVideo } from './project-video';
import { ContactPaper } from './contact-paper';
import { UnlockCelebration } from './unlock-celebration';
import { playUISound } from '@/lib/ui-sounds.js';
import {
  Toast,
  ToastAction,
  ToastContent,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from '@/components/ui/toast';
import {
  applyCharacter,
  initialPreferences,
  characters,
  description,
  profile,
  safariVideoSources,
  projects,
  unlockMessage,
  unlockContact,
} from '@/lib/portfolio';

import { usePreferences } from './use-preferences';


type CharacterMedia = { source: string | null; poster: string | null; locked?: boolean };

function CharacterVideo({ source, poster, locked = false, className, slowEnd = true, onEnded }: CharacterMedia & {
  className: string;
  slowEnd?: boolean;
  onEnded?: () => void;
}) {
  const [shown, setShown] = useState<CharacterMedia>({ source, poster, locked });
  const [readySource, setReadySource] = useState<string | null>(null);
  const [requestedSource, setRequestedSource] = useState(source);
  const [revealSource, setRevealSource] = useState(source);
  if (requestedSource !== source) {
    setRequestedSource(source);
    setReadySource(null);
    setRevealSource(null);
  }
  useEffect(() => {
    const timeout = setTimeout(() => setRevealSource(source), 180);
    return () => clearTimeout(timeout);
  }, [source]);
  const canReveal = revealSource === source;
  const pending = source !== shown.source;
  const fading = pending && canReveal && readySource === source;
  useEffect(() => {
    if (!fading) return;
    const timeout = setTimeout(() => setShown({ source, poster, locked }), 180);
    return () => clearTimeout(timeout);
  }, [fading, source, poster, locked]);
  const layers = pending && shown.source ? [shown, { source, poster, locked }] : [{ source, poster, locked }];

  return source ? (
    <>
    <div className={`${className} character-video`}>
      {poster && (
        <Image
          key={poster}
          src={poster}
          alt=""
          fill
          unoptimized
          loading="eager"
          className="character-video-poster"
          data-locked={locked}
          style={{ objectFit: 'inherit', opacity: canReveal && readySource !== source ? 1 : 0 }}
        />
      )}
      {layers.map((media) => media.source && (
        <CharacterVideoLayer
          key={media.source}
          source={media.source}
          locked={media.source === source ? locked : Boolean(media.locked)}
          visible={canReveal && media.source === source && readySource === source}
          slowEnd={media.source === source && slowEnd}
          onReady={media.source === source ? () => setReadySource(media.source) : undefined}
          onEnded={media.source === source ? onEnded : undefined}
        />
      ))}
    </div>
    <div className="locked-portrait-overlay" aria-hidden={!locked || !canReveal}
      style={{ opacity: locked && canReveal ? 1 : 0 }}>
      <p className="locked-portrait-hint">Найдите послание в конце сайта</p>
    </div>
    </>
  ) : (
    <div className={`${className} placeholder`}>
      <span className="sr-only">Видео персонажа пока не добавлено</span>
    </div>
  );
}

function CharacterVideoLayer({ source, visible, locked, slowEnd, onReady, onEnded }: {
  source: string;
  visible: boolean;
  locked: boolean;
  slowEnd: boolean;
  onReady?: () => void;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readyRef = useRef(onReady);
  const decodedFrame = useRef<number | null>(null);
  useLayoutEffect(() => { readyRef.current = onReady; }, [onReady]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const markReady = () => {
      if (decodedFrame.current !== null) return;
      if (video.requestVideoFrameCallback && !video.paused && !video.ended) {
        decodedFrame.current = video.requestVideoFrameCallback(() => {
          decodedFrame.current = null;
          readyRef.current?.();
        });
      } else {
        readyRef.current?.();
      }
    };
    video.addEventListener('loadeddata', markReady);
    // Cached media can load before React hydrates and attaches its handlers.
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady();
    return () => {
      video.removeEventListener('loadeddata', markReady);
      if (decodedFrame.current !== null) {
        video.cancelVideoFrameCallback?.(decodedFrame.current);
        decodedFrame.current = null;
      }
    };
  }, [source]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !slowEnd) return;
    let frame = 0;
    const stop = () => cancelAnimationFrame(frame);
    const update = () => {
      if (video.paused || video.ended) return;
      if (Number.isFinite(video.duration) && video.duration > 0) {
        const slowdownDuration = Math.min(1.2, video.duration / 2);
        const progress = Math.max(0, Math.min(1, 1 - (video.duration - video.currentTime) / slowdownDuration));
        const eased = progress * progress * (3 - 2 * progress);
        const startProgress = Math.max(0, Math.min(1, video.currentTime / Math.min(0.6, video.duration / 2)));
        const startEased = startProgress * startProgress * (3 - 2 * startProgress);
        video.playbackRate = Math.min(0.35 + 0.65 * startEased, 1 - 0.85 * eased);
      }
      frame = requestAnimationFrame(update);
    };
    const start = () => {
      stop();
      update();
    };
    video.addEventListener('play', start);
    video.addEventListener('pause', stop);
    video.addEventListener('ended', stop);
    start();
    return () => {
      stop();
      video.removeEventListener('play', start);
      video.removeEventListener('pause', stop);
      video.removeEventListener('ended', stop);
      video.playbackRate = 1;
    };
  }, [source, slowEnd]);

  return (
    <video
      ref={videoRef}
      data-locked={locked}
      style={{ opacity: visible ? 1 : 0 }}
      preload="auto"
      autoPlay
      muted
      onEnded={onEnded}
      playsInline
      aria-label="Видео персонажа"
    >
      {safariVideoSources[source] && (
        <source src={safariVideoSources[source]} type='video/quicktime; codecs="hvc1"' />
      )}
      <source src={source} type="video/webm" />
    </video>
  );
}

function useEmailCopy() {
  const [emailState, setEmailState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const copyingEmail = useRef(false);
  useEffect(() => {
    if (emailState !== 'copied' && emailState !== 'error') return;
    const timeout = window.setTimeout(() => setEmailState('idle'), 2000);
    return () => window.clearTimeout(timeout);
  }, [emailState]);

  async function copyEmail() {
    if (copyingEmail.current) return;
    copyingEmail.current = true;
    setEmailState('copying');
    try {
      await navigator.clipboard.writeText(profile.email);
      setEmailState('copied');
      playUISound('click');
      return true;
    } catch {
      setEmailState('error');
    } finally {
      copyingEmail.current = false;
    }
  }

  return { state: emailState, copy: copyEmail };
}

function CopyFeedback({ text, slide = false }: { text: string; slide?: boolean }) {
  const reducedMotion = useReducedMotion();
  return (
    <span className="copy-feedback" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={text}
          initial={{ opacity: 0, y: slide && !reducedMotion ? 8 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: slide && !reducedMotion ? -8 : 0, transition: { duration: reducedMotion ? 0 : 0.1, ease: 'easeOut' } }}
          transition={{ duration: reducedMotion ? 0 : slide ? 0.18 : 0.14, ease: 'easeOut' }}
        >{text}</motion.span>
      </AnimatePresence>
    </span>
  );
}

function Notifications() {
  const { toasts } = useToastManager();
  return (
    <ToastPortal>
      <ToastViewport className="portfolio-toasts">
        {toasts.map((item) => (
          <Toast className="portfolio-toast" key={item.id} toast={item}>
            <ToastContent className="portfolio-toast-content">
              <div className="portfolio-toast-message">
                <UnlockCelebration />
                <ToastTitle className="portfolio-toast-title" />
              </div>
              {item.actionProps && (
                <ToastAction
                  className="control compact-control toast-action"
                  render={<button aria-label="Посмотреть новый стиль" />}
                />
              )}
            </ToastContent>
          </Toast>
        ))}
      </ToastViewport>
    </ToastPortal>
  );
}

function PortfolioContent() {
  const reducedMotion = useReducedMotion();
  const navigationTransition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 900, damping: 60 };
  const markerControls = useAnimationControls();
  const navigationRef = useRef<HTMLElement>(null);
  const markerInitialized = useRef(false);
  const scrollAnimation = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    const stop = () => scrollAnimation.current?.stop();
    const stopOnKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) stop();
    };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stopOnKey);
    window.addEventListener('popstate', stop);
    return () => {
      stop();
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', stopOnKey);
      window.removeEventListener('popstate', stop);
    };
  }, []);

  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = event.currentTarget.hash;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    event.preventDefault();
    scrollAnimation.current?.stop();
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const destination = hash === '#about' ? 0 : Math.max(0, Math.min(
      target.getBoundingClientRect().top + window.scrollY - margin,
      document.documentElement.scrollHeight - window.innerHeight,
    ));
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    if (reducedMotion) {
      window.scrollTo({ top: destination, behavior: 'instant' });
      return;
    }
    scrollAnimation.current = animate(window.scrollY, destination, {
      duration: 0.4,
      ease: 'easeOut',
      onUpdate: (top) => window.scrollTo({ top, behavior: 'instant' }),
    });
  };

  const swipeStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const [prefs, setPrefs] = usePreferences();
  const footerEmail = useEmailCopy();
  const contactEmail = useEmailCopy();
  const [paperReset, setPaperReset] = useState(0);
  const [navigation, setNavigation] = useState({
    id: projects[0].id as string,
    index: 0,
  });
  const activeProject = navigation.id;
  const [selected, setSelected] = useState<number | null>(null);
  const introRef = useRef<HTMLElement>(null);
  const { add, close } = useToastManager();
  const toastDelay = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastDismiss = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => {
    clearTimeout(toastDelay.current);
    clearTimeout(toastDismiss.current);
  }, []);

  const showUnlockToast = useCallback((characterId = 'character-3') => {
    clearTimeout(toastDelay.current);
    clearTimeout(toastDismiss.current);
    close();
    toastDelay.current = setTimeout(() => {
      const toastId = crypto.randomUUID();
      add({
        id: toastId,
        title: 'Вы разблокировали новый стиль',
        timeout: 0,
        actionProps: {
          children: 'Посмотреть',
          onClick: () => {
            clearTimeout(toastDismiss.current);
            close(toastId);
            const index = Math.max(0, characters.findIndex((character) => character.id === characterId));
            setSelected(index);
            introRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
      });
      toastDismiss.current = setTimeout(() => close(toastId), 5000);
    }, 200);
  }, [add, close]);

  useEffect(() => {
    const debugToast = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey || event.repeat) return;
      if (event.code !== 'KeyU' && event.code !== 'Backspace') return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      if (event.code === 'KeyU') {
        showUnlockToast();
      } else {
        clearTimeout(toastDelay.current);
        clearTimeout(toastDismiss.current);
        close();
        setPaperReset((value) => value + 1);
        setSelected(0);
        setPrefs((previous) => ({ ...previous, unlocked: [...initialPreferences.unlocked], character: initialPreferences.character }));
      }
    };
    window.addEventListener('keydown', debugToast);
    return () => window.removeEventListener('keydown', debugToast);
  }, [showUnlockToast, close, setPrefs]);

  useLayoutEffect(() => {
    const nav = navigationRef.current;
    if (!nav) return;
    const updateMarker = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="location"]');
      if (!active || !nav.getClientRects().length) return;
      const target = {
        y: active.offsetTop + active.offsetHeight / 2 - 6,
        rotate: navigation.index * 90,
      };
      if (!markerInitialized.current || reducedMotion) {
        markerControls.set(target);
        markerInitialized.current = true;
      } else {
        void markerControls.start({
          ...target,
          transition: { type: 'spring', stiffness: 900, damping: 60 },
        });
      }
    };
    updateMarker();
    const observer = new ResizeObserver(updateMarker);
    observer.observe(nav);
    nav.querySelectorAll('a').forEach((link) => observer.observe(link));
    return () => observer.disconnect();
  }, [activeProject, navigation.index, reducedMotion, markerControls]);

  useEffect(() => {
    const root = document.documentElement;
    const changing =
      root.dataset.theme !== undefined && root.dataset.theme !== prefs.theme;
    if (changing) root.classList.add('theme-changing');
    root.dataset.theme = prefs.theme;
    const timeout = window.setTimeout(
      () => root.classList.remove('theme-changing'),
      350,
    );
    return () => {
      window.clearTimeout(timeout);
      root.classList.remove('theme-changing');
    };
  }, [prefs.theme]);
  useEffect(() => {
    const update = () => {
      const entries = projects.map((project) => ({
        id: project.id,
        top:
          document.getElementById(project.id)?.getBoundingClientRect().top ??
          Infinity,
      }));
      const current = entries
        .filter((entry) => entry.top < window.innerHeight * 0.5)
        .at(-1);
      if (current) {
        setNavigation((previous) =>
          previous.id === current.id
            ? previous
            : {
                id: current.id,
                index: projects.findIndex((project) => project.id === current.id),
              },
        );
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  const activeIndex = selected ?? Math.max(0, characters.findIndex(c => c.id === prefs.character));
  const current = characters[activeIndex];
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('skin-changing');
    root.dataset.skin = current.id;
    const timeout = window.setTimeout(() => root.classList.remove('skin-changing'), 350);
    return () => { window.clearTimeout(timeout); root.classList.remove('skin-changing'); };
  }, [current.id]);
  const isUnlocked = prefs.unlocked.includes(current.id);
  useEffect(() => {
    if (selected !== null && isUnlocked && prefs.character !== current.id) {
      setPrefs(previous => applyCharacter(previous, current.id));
    }
  }, [selected, isUnlocked, prefs.character, current.id, setPrefs]);
  const chooseStyle = (index: number) => {
    playUISound('click');
    setSelected(index);
    setPrefs(previous => applyCharacter(previous, characters[index].id));
  };
  const unlockFromContact = () => {
    if (!prefs.unlocked.includes('corporate')) {
      setPrefs(previous => unlockContact(previous));
      showUnlockToast('corporate');
    }
  };
  const contactLinks = (compact = false) => (
    <>
      <a href={profile.telegramUrl} target="_blank" rel="noreferrer" onClick={unlockFromContact}
        className={`control primary-control ${compact ? 'compact-control' : 'main-control'}`}>Telegram</a>
      <button type="button" onClick={async () => { if (await contactEmail.copy()) unlockFromContact(); }}
        disabled={contactEmail.state === 'copying'}
        className={`control primary-control ${compact ? 'compact-control' : 'main-control'}`}>
        <CopyFeedback slide text={contactEmail.state === 'copied' ? 'Скопировано' : contactEmail.state === 'error' ? 'Не удалось' : 'Почта'} />
      </button>
      <a href={profile.resumeUrl} target="_blank" rel="noreferrer" onClick={() => playUISound('click')}
        className={`control resume-control ${compact ? 'compact-control' : 'main-control'}`}>Посмотреть резюме</a>
    </>
  );

  return (
    <>
      <main className="portfolio">
        <section
          className="intro"
          id="about"
          aria-label="Обо мне"
          ref={introRef}
        >
          <div className="customize-toolbar inline-style-switcher">
              <button className="control icon-control" type="button" aria-label="Предыдущий стиль"
                onClick={() => chooseStyle((activeIndex + characters.length - 1) % characters.length)}><AnimatedIcon name="chevronLeft" trigger="click" size={16} /></button>
            <div className="style-dots" role="group" aria-label="Стили персонажа">
              {characters.map((character, index) => (
                <button key={character.id} type="button" className="style-dot-hit"
                  aria-label={`${character.name}${prefs.unlocked.includes(character.id) ? '' : ', закрыт'}`}
                  aria-pressed={index === activeIndex} onClick={() => chooseStyle(index)}>
                  <motion.span style={{ backgroundColor: index === activeIndex ? 'var(--accent)' : 'var(--foreground)' }} animate={{ width: index === activeIndex ? 12 : 4, opacity: index === activeIndex ? 1 : 0.3 }}
                    transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }} />
                </button>
              ))}
            </div>
              <button className="control icon-control" type="button" aria-label="Следующий стиль"
                onClick={() => chooseStyle((activeIndex + 1) % characters.length)}><AnimatedIcon name="chevronRight" trigger="click" size={16} /></button>
          </div>
          <div className="portrait-entry"
            onPointerDown={event => {
              if (event.pointerType !== 'touch' || !event.isPrimary) return;
              swipeStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerCancel={() => { swipeStart.current = null; }}
            onPointerUp={event => {
              const start = swipeStart.current;
              swipeStart.current = null;
              if (!start || start.id !== event.pointerId) return;
              const dx = event.clientX - start.x;
              const dy = event.clientY - start.y;
              if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
              chooseStyle((activeIndex + (dx < 0 ? 1 : -1) + characters.length) % characters.length);
            }}
            onPointerEnter={event => {
            if (event.pointerType !== 'mouse' || reducedMotion) return;
            const layers = Array.from(event.currentTarget.querySelectorAll('video'));
            const video = layers.find(layer => layer.style.opacity === '1') ?? layers.at(-1);
            if (!video || (!video.paused && !video.ended)) return;
            video.currentTime = 0;
            video.playbackRate = 0.35;
            void video.play().catch(() => {});
          }}>
            <CharacterVideo
              locked={!isUnlocked}
              className={`portrait${isUnlocked ? '' : ' is-locked'}`}
              source={prefs.theme === 'dark' ? current?.darkVideo ?? current?.video ?? profile.defaultDarkVideo : current?.video ?? profile.defaultVideo}
              poster={prefs.theme === 'dark' ? current?.darkPoster ?? current?.poster ?? profile.defaultDarkPoster : current?.poster ?? profile.defaultPoster}
            />
          </div>
          <div className="bio text-block">
            <h1 className="intro-name">{profile.name}</h1>
            <p className="secondary">
              Дизайнер продукта, ориентирующийся
              <br className="bio-break" /> на понятность и удобства интерфейса
            </p>
          </div>
          <div className="experience text-block">
            <h2>Опыт</h2>
            <p className="secondary">{description.slice(0, -5)}<span className="avito-label">Avito<AvitoSticker /></span></p>
          </div>
          <div className="intro-actions">
            {contactLinks()}
          </div>
        </section>
        <section className="projects" aria-label="Проекты">
          <aside className="project-sidebar">
            <nav ref={navigationRef} aria-label="Навигация по портфолио">
              <motion.span
                className="project-marker"
                initial={false}
                animate={markerControls}
                aria-hidden="true"
              />
              {projects.map((project) => (
                <a
                  key={project.id}
                  href={`#${project.id}`}
                    onClick={scrollToSection}
                  className={activeProject === project.id ? 'active' : ''}
                  aria-current={
                    activeProject === project.id ? 'location' : undefined
                  }
                >
                  <motion.span
                    className="project-nav-label"
                    initial={false}
                    animate={{ x: activeProject === project.id ? 20 : 0 }}
                    transition={navigationTransition}
                  >
                    {project.label}
                  </motion.span>
                </a>
              ))}
            </nav>
          </aside>
          <div className="case">
            {projects.map((project) => (
              <article
                id={project.id}
                key={project.id}
                className="project"
                aria-label={project.label.replace('\n', ' ')}
              >
                <figure>
                  <ProjectVideo source={project.video} poster={project.poster} label={project.label} />
                  <figcaption>Описание проекта «{project.label}» скоро появится.</figcaption>
                </figure>
              </article>
            ))}
          </div>
          <footer className="footer">
            <ContactPaper key={paperReset} onReveal={() => {
              if (prefs.unlocked.includes('character-3')) return;
              setPrefs((previous) => unlockMessage(previous));
              showUnlockToast();
            }} />
            <div className="footer-links">
              <button type="button" className="footer-copy" onClick={footerEmail.copy} disabled={footerEmail.state === 'copying'}>
                <span className="footer-copy-sizer" aria-hidden="true">Скопировать почту</span>
                <CopyFeedback slide text={footerEmail.state === 'copied' ? 'Скопировано' : footerEmail.state === 'error' ? 'Не удалось' : 'Скопировать почту'} />
              </button>
              <a href={profile.telegramUrl} target="_blank" rel="noreferrer">Telegram</a>
              <span className="footer-divider" aria-hidden="true" />
              <a href={profile.resumeUrl} target="_blank" rel="noreferrer">CV</a>
            </div>
          </footer>
        </section>
      </main>
      <Notifications />
    </>
  );
}

export default function Portfolio() {
  return (
    <ToastProvider limit={1}>
      <PortfolioContent />
    </ToastProvider>
  );
}
