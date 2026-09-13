'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { profile } from '@/lib/portfolio';
import { playUISound } from '@/lib/ui-sounds.js';

export function useEmailCopy() {
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

export function CopyFeedback({ text, slide = false }: { text: string; slide?: boolean }) {
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

export function FooterContacts({ resumeHref }: { resumeHref?: string }) {
  const email = useEmailCopy();
  return <div className="footer-links">
    <button type="button" className="footer-copy" onClick={email.copy} disabled={email.state === 'copying'}>
      <span className="footer-copy-sizer" aria-hidden="true">Скопировать почту</span>
      <CopyFeedback slide text={email.state === 'copied' ? 'Скопировано' : email.state === 'error' ? 'Не удалось' : 'Скопировать почту'} />
    </button>
    <a href={profile.telegramUrl} target="_blank" rel="noreferrer">Telegram</a>
    {resumeHref && <>
      <span className="footer-divider" aria-hidden="true" />
      <a href={resumeHref}>CV</a>
    </>}
  </div>;
}
