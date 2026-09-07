'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import { LockKeyhole, Send } from 'lucide-react';
import { ThemeIcon } from './theme-icon';
import { animate, motion, useAnimationControls, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { AnimatedIcon } from './animated-icon';
import { AvitoSticker } from './avito-sticker';
import { FooterSignature } from './footer-signature';
import { ContactPaper } from './contact-paper';
import { UnlockCelebration } from './unlock-celebration';
import { playUISound } from '@/lib/ui-sounds.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
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
} from '@/lib/portfolio';

import { usePreferences } from './use-preferences';

type Panel = 'contacts' | 'customize' | null;

type CharacterMedia = { source: string | null; poster: string | null };

function CharacterVideo({ source, poster, className, slowEnd = true, onEnded }: CharacterMedia & {
  className: string;
  slowEnd?: boolean;
  onEnded?: () => void;
}) {
  const [shown, setShown] = useState<CharacterMedia>({ source, poster });
  const [readySource, setReadySource] = useState<string | null>(null);
  const pending = source !== shown.source;
  const fading = pending && readySource === source;
  useEffect(() => {
    if (!fading) return;
    const timeout = setTimeout(() => setShown({ source, poster }), 300);
    return () => clearTimeout(timeout);
  }, [fading, source, poster]);
  const layers = pending && shown.source ? [shown, { source, poster }] : [{ source, poster }];

  return source ? (
    <div className={`${className} character-video`}>
      {layers.map((media) => media.source && (
        <CharacterVideoLayer
          key={media.source}
          source={media.source}
          poster={media.poster}
          visible={pending ? (media.source === source ? fading || !shown.source : !fading) : true}
          slowEnd={media.source === source && slowEnd}
          onReady={media.source === source ? () => setReadySource(media.source) : undefined}
          onEnded={media.source === source ? onEnded : undefined}
        />
      ))}
    </div>
  ) : (
    <div className={`${className} placeholder`}>
      <span className="sr-only">Видео персонажа пока не добавлено</span>
    </div>
  );
}

function CharacterVideoLayer({ source, poster, visible, slowEnd, onReady, onEnded }: {
  source: string;
  poster: string | null;
  visible: boolean;
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
    return () => {
      if (video && decodedFrame.current !== null) video.cancelVideoFrameCallback?.(decodedFrame.current);
    };
  }, []);

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
        video.playbackRate = 1 - 0.85 * eased;
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
      poster={poster ?? undefined}
      style={{ opacity: visible ? 1 : 0 }}
      preload="auto"
      autoPlay
      muted
      onLoadedData={() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.requestVideoFrameCallback) {
          decodedFrame.current = video.requestVideoFrameCallback(() => {
            decodedFrame.current = null;
            readyRef.current?.();
          });
        } else {
          readyRef.current?.();
        }
      }}
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
    playUISound('click');
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = event.currentTarget.hash;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    event.preventDefault();
    scrollAnimation.current?.stop();
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const destination = Math.max(0, Math.min(
      target.getBoundingClientRect().top + window.scrollY - margin,
      document.documentElement.scrollHeight - window.innerHeight,
    ));
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    if (reducedMotion) {
      window.scrollTo({ top: destination, behavior: 'instant' });
      return;
    }
    scrollAnimation.current = animate(window.scrollY, destination, {
      duration: 0.3,
      ease: 'easeOut',
      onUpdate: (top) => window.scrollTo({ top, behavior: 'instant' }),
    });
  };

  const [prefs, setPrefs] = usePreferences();
  const [panel, setPanel] = useState<Panel>(null);
  const [renderedPanel, setRenderedPanel] = useState<Exclude<Panel, null>>('contacts');
  if (panel !== null && panel !== renderedPanel) setRenderedPanel(panel);
  const [sticky, setSticky] = useState(false);
  const [navigation, setNavigation] = useState({
    id: 'hints',
    index: 2,
  });
  const activeProject = navigation.id;
  const [selected, setSelected] = useState(0);
  const [carouselStart, setCarouselStart] = useState(0);
  const [carousel, setCarousel] = useState<CarouselApi>();
  const [copyState, setCopyState] = useState<string | null>(null);
  const introRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const { add, close } = useToastManager();
  const toastDelay = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastDismiss = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => {
    clearTimeout(toastDelay.current);
    clearTimeout(toastDismiss.current);
  }, []);

  const showUnlockToast = useCallback(() => {
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
            setCarouselStart(2); setSelected(2); setPanel('customize');
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
        setPanel(null);
        setCopyState(null);
        setCarouselStart(0);
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
      const rect = introRef.current?.getBoundingClientRect();
      // Separate thresholds prevent flicker when scrolling near the boundary.
      setSticky((visible) => {
        if (!rect) return false;
        return visible ? rect.bottom < -24 : rect.bottom <= -48;
      });
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
  const openPanel = useCallback(
    (next: Panel) => {
      openerRef.current = document.activeElement as HTMLElement | null;
      setCopyState(null);
      if (next === 'customize') {
        const index = Math.max(0, characters.findIndex((c) => c.id === prefs.character));
        setCarouselStart(index);
        setSelected(index);
      }
      setPanel(next);
    },
    [prefs.character],
  );
  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.repeat ||
        panel ||
        (event.target instanceof HTMLElement &&
          (event.target.isContentEditable ||
            event.target.closest('input,textarea,select')))
      )
        return;
      if (event.code === 'KeyC' || ['c', 'с', 'ц'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        openPanel('contacts');
      }
      if (event.code === 'KeyR' || event.key.toLowerCase() === 'r' || event.key.toLowerCase() === 'к') {
        event.preventDefault();
        window.open(profile.resumeUrl, '_blank', 'noopener,noreferrer');
      }
    };
    window.addEventListener('keydown', shortcuts);
    return () => window.removeEventListener('keydown', shortcuts);
  }, [panel, openPanel]);
  useLayoutEffect(() => {
    if (panel === 'customize') carousel?.scrollTo(carouselStart, true);
  }, [carousel, carouselStart, panel]);
  useEffect(() => {
    if (!carousel) return;
    let current = carousel.selectedScrollSnap();
    const select = () => {
      const next = carousel.selectedScrollSnap();
      if (next !== current) playUISound('hover', 1);
      current = next;
      setSelected(next);
    };
    const area = carousel.rootNode();
    let accumulated = 0;
    let lastWheel = 0;
    let direction = 0;
    let switched = false;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      const now = performance.now();
      const nextDirection = Math.sign(delta);
      if (now - lastWheel > 160 || direction !== nextDirection) {
        accumulated = 0;
        switched = false;
      }
      lastWheel = now;
      direction = nextDirection;
      accumulated += delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? area.clientWidth : 1);
      if (!switched && Math.abs(accumulated) >= 24) {
        if (direction > 0) carousel.scrollNext();
        else carousel.scrollPrev();
        switched = true;
      }
    };
    area.addEventListener('wheel', wheel, { passive: false });
    carousel.on('select', select);
    return () => {
      area.removeEventListener('wheel', wheel);
      carousel.off('select', select);
    };
  }, [carousel]);
  useEffect(() => {
    if (!copyState) return;
    const timeout = window.setTimeout(() => setCopyState(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function copyContact(kind: 'email' | 'telegram') {
    try {
      await navigator.clipboard.writeText(
        kind === 'email' ? profile.email : profile.telegram,
      );
      setCopyState(kind);

    } catch {
      setCopyState('error');
    }
  }

  const current = characters.find((c) => c.id === prefs.character);
  const displayName = current?.id === 'character-3' ? `${profile.name} 7 лет` : profile.name;
  const preview = characters[selected];
  const canApply = prefs.unlocked.includes(preview.id);
  const resume = (compact = false) => (
    <a
      href={profile.resumeUrl}
      target="_blank"
      rel="noreferrer"
      className={`control ${compact ? 'compact-control' : 'main-control'}`}
      onClick={() => playUISound('click')}
    >
      Резюме<kbd>R</kbd>
    </a>
  );

  return (
    <Dialog
      open={panel !== null}
      onOpenChange={(open) => {
        if (!open) setPanel(null);
      }}
    >
      <header
        className="sticky-header"
        data-visible={sticky}
        aria-hidden={!sticky}
        inert={!sticky}
        aria-label="Закреплённая шапка"
      >
        <div className="sticky-inner">
          <a className="sticky-profile" href="#about" aria-label="Обо мне">
            <span>
              <span>{displayName}</span>
              <span className="secondary">{profile.role}</span>
            </span>
          </a>
          <div className="sticky-actions">
            {resume(true)}
            <button
              type="button"
              className="control primary-control sticky-contact"
              onClick={() => {
                playUISound('click');
                openPanel('contacts');
              }}
              aria-label="Контакты"
            >
              <span>Контакты</span>
              <kbd>C</kbd>
              <AnimatedIcon name="mail" className="mobile-mail" size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="portfolio">
        <section
          className="intro"
          id="about"
          aria-label="Обо мне"
          ref={introRef}
        >
          <div className="customize-toolbar">
            <button
              className="control customize-button"
              type="button"
              onClick={() => {
                playUISound('click');
                openPanel('customize');
              }}
            >
              <AnimatedIcon name="palette" size={16} />
              <span>Кастомизация</span>
              <span className="secondary">{prefs.unlocked.length} из {characters.length}</span>
            </button>
            <button
              className="control icon-control"
              type="button"
              aria-label={
                prefs.theme === 'light'
                  ? 'Включить тёмную тему'
                  : 'Включить светлую тему'
              }
              onClick={() => {
                playUISound('toggle');
                setPrefs((previous) => ({
                  ...previous,
                  theme: previous.theme === 'light' ? 'dark' : 'light',
                }));
              }}
            >
              <ThemeIcon theme={prefs.theme} />
            </button>
          </div>
          <div className="portrait-entry">
            <CharacterVideo
              className="portrait"
              source={prefs.theme === 'dark' ? current?.darkVideo ?? current?.video ?? profile.defaultDarkVideo : current?.video ?? profile.defaultVideo}
              poster={prefs.theme === 'dark' ? current?.darkPoster ?? current?.poster ?? profile.defaultDarkPoster : current?.poster ?? profile.defaultPoster}
            />
          </div>
          <div className="bio text-block">
            <h1 className="intro-name" aria-label={displayName}>
              {displayName.split(' ').map((word, index) => (
                <span className="name-mask" key={word} aria-hidden="true">
                  <span
                    style={{
                      animationDelay: `calc(var(--name-start-delay) + ${index * 100}ms)`,
                    }}
                  >
                    {word}
                  </span>
                </span>
              ))}
            </h1>
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
            {resume()}
            <button
              className="control main-control primary-control"
              type="button"
              onClick={() => {
                playUISound('click');
                openPanel('contacts');
              }}
            >
              Контакты<kbd>C</kbd>
            </button>
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
              <a
                href="#about"
                onMouseEnter={() => playUISound('hover', 0.7)}
                onClick={scrollToSection}
              >
                Обо мне
              </a>
              <hr />
              {projects.map((project) => (
                <a
                  key={project.id}
                  href={`#${project.id}`}
                  onMouseEnter={() => playUISound('hover', 0.7)}
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
                  <div className="case-media placeholder">
                    <span className="sr-only">
                      {project.label}: изображение пока не добавлено
                    </span>
                  </div>
                  <figcaption>{description}</figcaption>
                </figure>
              </article>
            ))}
          </div>
          <footer className="footer">
            <FooterSignature />
            <div className="footer-links">
              <a href={`mailto:${profile.email}`}
                onMouseEnter={() => playUISound('hover', 0.7)}
                onClick={() => playUISound('click')}
              >Почта</a>
              <a href={profile.telegramUrl} target="_blank" rel="noreferrer"
                onMouseEnter={() => playUISound('hover', 0.7)}
                onClick={() => playUISound('click')}
              >
                Telegram
              </a>
            </div>
          </footer>
        </section>
      </main>
      <DialogContent
        className={`portfolio-dialog ${renderedPanel === 'contacts' ? 'contacts-dialog' : 'customize-dialog'}`}
        showCloseButton={false}
        finalFocus={openerRef}
      >
        <button
          className="sheet-handle"
          type="button"
          onClick={() => setPanel(null)}
          aria-label="Закрыть окно"
        >
          <span />
        </button>
        <div className="modal-heading">
          <DialogTitle className="modal-title">
            {renderedPanel === 'contacts' ? 'Контакты' : 'Данила Плешаков, 21 год'}
          </DialogTitle>
          <DialogClose
            className="control icon-control desktop-close"
            aria-label="Закрыть окно"
          >
            <AnimatedIcon name="close" size={16} />
          </DialogClose>
        </div>
        {renderedPanel === 'contacts' ? (
          <>
            <div className="contact-list">
              {(['email', 'telegram'] as const).map((kind) => (
                <button
                  className="contact-row"
                  key={kind}
                  type="button"
                  onClick={() => copyContact(kind)}
                  aria-label={`Скопировать ${kind === 'email' ? 'email' : 'Telegram'}`}
                >
                  {kind === 'telegram'
                    ? <Send size={20} aria-hidden="true" />
                    : <AnimatedIcon name="link" size={20} />}
                  <span>
                    <span className="secondary">
                      {copyState === kind
                        ? 'Скопировано'
                        : kind === 'email'
                          ? 'Email'
                          : 'Telegram'}
                    </span>
                    <span>
                      {kind === 'email' ? profile.email : profile.telegram}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {copyState === 'error' && (
              <output className="copy-error">
                Не удалось скопировать. Выделите адрес и скопируйте вручную.
              </output>
            )}
            <ContactPaper onReveal={() => {
              if (prefs.unlocked.includes('character-3')) return;
              setPrefs((previous) => unlockMessage(previous));
              showUnlockToast();
            }} />
          </>
        ) : (
          <>
            <div className="character-preview">
              <CharacterVideo
                className={`character-preview-media${canApply ? '' : ' is-locked'}`}
                source={prefs.theme === 'dark' ? preview.darkVideo ?? preview.video : preview.video}
                poster={prefs.theme === 'dark' ? preview.darkPoster ?? preview.poster : preview.poster}
              />
            </div>
            <div className="style-controls">
              <p className="style-label secondary">Стили</p>
              <Carousel
                className="character-carousel"
                opts={{ align: 'center', containScroll: false, duration: reducedMotion ? 0 : 20, startIndex: carouselStart }}
                setApi={setCarousel}
                aria-label="Персонажи"
                aria-roledescription="карусель"
              >
                <CarouselContent className="character-track">
                  {characters.map((character, index) => (
                    <CarouselItem
                      className="character-slide"
                      key={character.id}
                      aria-roledescription="персонаж"
                    >
                      <button
                        className={`character-tile ${selected === index ? 'selected' : ''}`}
                        type="button"
                        onClick={() => {
                          carousel?.scrollTo(index);
                        }}
                        aria-label={`${character.name}${prefs.unlocked.includes(character.id) ? '' : ', закрыт'}`}
                        aria-pressed={selected === index}
                      >
                        {(prefs.theme === 'dark' ? character.darkPoster ?? character.poster : character.poster) && (
                          <Image
                            width={64}
                            height={64}
                            unoptimized
                            className={`character-tile-image${prefs.unlocked.includes(character.id) ? '' : ' is-locked'}`}
                            src={(prefs.theme === 'dark' ? character.darkPoster ?? character.poster : character.poster) ?? ''}
                            alt=""
                            draggable={false}
                          />
                        )}
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <p className="character-name" aria-live="polite">
                {preview.name}
              </p>
              <div className="style-action">
                {canApply ? (
                  <button
                    className="control main-control primary-control apply-control"
                    type="button"
                    onClick={() => {
                      playUISound('click', 0.65);
                      setPrefs((previous) =>
                        applyCharacter(previous, preview.id),
                      );
                      setPanel(null);
                    }}
                  >
                    Применить
                  </button>
                ) : (
                  <p className="locked-message">
                    <LockKeyhole size={16} aria-hidden="true" />
                    <span>
                      {preview.unlock === 'message'
                        ? 'Найдите послание в контактах'
                        : 'Этот персонаж пока недоступен'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
      <Notifications />
    </Dialog>
  );
}

export default function Portfolio() {
  return (
    <ToastProvider limit={1}>
      <PortfolioContent />
    </ToastProvider>
  );
}
