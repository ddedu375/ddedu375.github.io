'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { characters, preferenceKey, readPreferences } from '@/lib/portfolio';
import { AnimatedIcon } from '@/components/portfolio/animated-icon';
import { FooterContacts } from '@/components/portfolio/email-copy';
import { usePageTitle } from '@/components/portfolio/use-page-title';
import { syncAccentFavicon } from '@/lib/favicon';
import content from '@/lib/resume-content.json';
import { playUISound } from '@/lib/ui-sounds.js';

export function ResumePage() {
  usePageTitle('Резюме');
  const [mode, setMode] = useState<'human' | 'agent'>('human');
  const [glitching, setGlitching] = useState(false);
  const screen = useRef<HTMLDivElement>(null);
  const clearCrossfade = useRef<() => void>(() => {});
  useEffect(() => () => clearCrossfade.current(), []);
  function changeMode(value: 'human' | 'agent') {
    if (mode === value) return;
    clearCrossfade.current();
    if (value === 'human' && screen.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Keep the outgoing terminal visually intact while the live Human page appears underneath.
      const snapshot = screen.current.cloneNode(true) as HTMLDivElement;
      snapshot.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      snapshot.querySelector('.resume-glitch-screen')?.remove();
      snapshot.dataset.glitching = 'false';
      snapshot.style.transform = `translateY(${-window.scrollY}px)`;
      snapshot.style.transition = 'none';
      const entrance = snapshot.querySelector<HTMLElement>('.resume-entrance');
      if (entrance) entrance.style.animation = 'none';
      const overlay = document.createElement('div');
      overlay.className = 'resume-crossfade';
      overlay.inert = true;
      overlay.setAttribute('aria-hidden', 'true');
      overlay.appendChild(snapshot);
      document.body.appendChild(overlay);
      const animation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-out', fill: 'forwards' });
      const cleanup = () => { animation.cancel(); overlay.remove(); };
      clearCrossfade.current = cleanup;
      animation.onfinish = cleanup;
    }
    playUISound('click');
    setGlitching(value === 'agent');
    setMode(value);
  }
  useEffect(() => {
    if (!glitching) return;
    const timer = window.setTimeout(() => setGlitching(false), 720);
    return () => window.clearTimeout(timer);
  }, [glitching]);
  useLayoutEffect(() => {
    let stopFavicon = () => {};
    const sync = () => {
      let saved = null;
      try { saved = localStorage.getItem(preferenceKey); } catch { /* Optional storage. */ }
      const requested = new URLSearchParams(window.location.search).get('style');
      const id = characters.some(character => character.id === requested) ? requested : readPreferences(saved).character;
      const root = document.documentElement;
      const transition = root.style.transition;
      root.style.transition = 'none';
      root.dataset.skin = id ?? 'character-2';
      stopFavicon();
      stopFavicon = syncAccentFavicon(false);
      root.style.transition = transition;
    };
    sync();
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('storage', sync); stopFavicon(); };
  }, []);
  return <div ref={screen} className="resume-screen" data-mode={mode} data-glitching={glitching}>
    {glitching && <div className="resume-glitch-screen" aria-hidden="true" />}
    <div className="resume-entrance">
    <main className="resume-page">
    <div className="resume-toolbar">
      <a className="resume-back" href="/" onClick={() => playUISound('click')}>
        <AnimatedIcon name="arrowLeft" />
        Назад
      </a>
    <div className="resume-mode" role="tablist" aria-label="Формат резюме">
      {(['human', 'agent'] as const).map(value => <button key={value} type="button" role="tab"
        id={`resume-tab-${value}`} aria-selected={mode === value} aria-controls="resume-content"
        onClick={() => changeMode(value)}>
        {value === 'human' ? 'Human' : 'Agent'}
      </button>)}
    </div>
    </div>
    <div key={mode} id="resume-content" role="tabpanel" aria-labelledby={`resume-tab-${mode}`}
      className={`resume-content resume-content-${mode}`} tabIndex={0}>
      {mode === 'agent' ? <>
        <div className="resume-terminal-prompt" aria-hidden="true">
          <span>~/portfolio</span> <span>$ cat resume.md</span>
        </div>
        <pre className="resume-markdown"><code>{content.markdown}</code></pre>
        <div className="resume-terminal-cursor" aria-hidden="true">$ <span /></div>
      </> : <>
        <section className="resume-section" aria-labelledby="resume-experience">
          <h2 id="resume-experience">Опыт работы <span className="secondary">3 года 2 месяца</span></h2>
          {content.jobs.map(job => <article className="resume-job" key={job.name}>
            <h3>{job.name}</h3>
            <p className="resume-job-meta">{job.meta}</p>
            {job.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            <ul>{job.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>
          </article>)}
        </section>
      </>}
    </div>
    <footer className="resume-downloads">
      <div className="resume-download-group" role="group" aria-label="Скачать резюме">
        {['pdf', 'html', 'md'].map(format => <a key={format}
          className="control resume-download-control"
          href={`/downloads/danila-pleshakov-resume.${format}`} download
          aria-label={`Скачать резюме в ${format.toUpperCase()}`}>
          {format === 'pdf' && <AnimatedIcon name="download" />}
          {format.toUpperCase()}
        </a>)}
      </div>
      <FooterContacts />
    </footer>
    </main>
    </div>
  </div>;
}
