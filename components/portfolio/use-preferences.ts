'use client';

import { useSyncExternalStore } from 'react';
import {
  initialPreferences,
  preferenceKey,
  readPreferences,
  type Preferences,
} from '@/lib/portfolio';

let snapshot = initialPreferences;
let lastRaw: string | null | undefined;
let memoryOnly = false;
const listeners = new Set<() => void>();

function getSnapshot(): Preferences {
  if (typeof window === 'undefined' || memoryOnly) return snapshot;
  try {
    const raw = localStorage.getItem(preferenceKey);
    if (raw !== lastRaw) {
      lastRaw = raw;
      snapshot = readPreferences(raw);
    }
  } catch {
    memoryOnly = true;
  }
  return snapshot;
}
function subscribe(notify: () => void) {
  listeners.add(notify);
  const onStorage = (event: StorageEvent) => {
    if (event.key === preferenceKey || event.key === null) {
      lastRaw = undefined;
      memoryOnly = false;
      notify();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener('storage', onStorage);
  };
}
function setPreferences(update: (previous: Preferences) => Preferences) {
  snapshot = update(getSnapshot());
  lastRaw = JSON.stringify(snapshot);
  try {
    localStorage.setItem(preferenceKey, lastRaw);
  } catch {
    memoryOnly = true;
  }
  listeners.forEach((notify) => notify());
}
export function usePreferences() {
  const prefs = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => initialPreferences,
  );
  return [prefs, setPreferences] as const;
}
