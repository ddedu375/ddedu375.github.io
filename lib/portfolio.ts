export type Character = {
  id: string;
  name: string;
  video: string | null;
  poster: string | null;
  darkVideo?: string;
  darkPoster?: string;
  darkTransitionVideo?: string;
  darkTransitionPoster?: string;
  unlock: 'message' | 'contact' | null;
};
export const profile = {
  name: 'Данила Плешаков',
  role: 'Дизайнер продукта',
  email: 'ddedu.production@gmail.com',
  telegram: '@daniladedu',
  telegramUrl: 'https://t.me/daniladedu',
  resumeUrl: '/resume',
  defaultVideo: '/videos/vladivostok-light-idle.webm' as string | null,
  defaultPoster: '/videos/vladivostok-light-idle.png' as string | null,
  darkTransitionVideo: '/videos/corporate-dark-switch.webm',
  darkTransitionPoster: '/videos/corporate-dark-switch.png',
  defaultDarkVideo: '/videos/vladivostok-dark-idle.webm',
  defaultDarkPoster: '/videos/vladivostok-dark-idle.png',
};
export const characters: Character[] = [
  { id: 'character-2', name: '+Вайбик', video: '/videos/vladivostok-light-idle.webm', poster: '/videos/vladivostok-light-idle.png', darkVideo: '/videos/vladivostok-dark-idle.webm', darkPoster: '/videos/vladivostok-dark-idle.png', darkTransitionVideo: '/videos/vladivostok-dark-switch.webm', darkTransitionPoster: '/videos/vladivostok-dark-switch.png', unlock: null },
  { id: 'corporate', name: 'Корпорат', video: '/videos/corporate-idle-stable.webm', poster: '/videos/corporate-idle-stable.png', darkVideo: '/videos/corporate-dark-idle.webm', darkPoster: '/videos/corporate-dark-idle.png', unlock: null },
  { id: 'character-3', name: 'Обратно в 1 класс', video: '/videos/school-light-idle.webm', poster: '/videos/school-light-idle.png', darkVideo: '/videos/school-dark-idle-short.webm', darkPoster: '/videos/school-dark-idle-short.png', darkTransitionVideo: '/videos/school-dark-switch-hair.webm', darkTransitionPoster: '/videos/school-dark-switch-hair.png', unlock: 'message' },
];
export const safariVideoSources: Record<string, string> = {
  '/videos/corporate-idle-stable.webm': '/videos/corporate-idle-stable.mov?alpha=straight',
  '/videos/corporate-dark-idle.webm': '/videos/corporate-dark-idle.mov?alpha=straight',
  '/videos/vladivostok-light-idle.webm': '/videos/vladivostok-light-idle.mov?alpha=straight',
  '/videos/vladivostok-dark-idle.webm': '/videos/vladivostok-dark-idle.mov?alpha=straight',
  '/videos/school-light-idle.webm': '/videos/school-light-idle.mov?alpha=straight',
  '/videos/school-dark-idle-short.webm': '/videos/school-dark-idle-short.mov?alpha=straight',
};
export const description =
  'Весь последний год работал над улучшением пользовательского опыта при использовании статистики в Avito';
export const projects = [
  { id: 'search', label: 'Real Time', video: '/projects/realtime.mp4', poster: '/projects/realtime.jpg' },
  { id: 'typer', label: 'Edit', video: '/projects/edit.mp4?v=2', poster: '/projects/edit.jpg?v=2' },
  { id: 'comparison', label: 'Подборка конкурентов', video: '/projects/comparison.mp4', poster: '/projects/comparison.jpg' },
  { id: 'promotion', label: 'Таймлайны', video: '/projects/timelines.mp4', poster: '/projects/timelines.jpg' },
  { id: 'hints', label: 'Подсказки', video: '/projects/hints.mp4', poster: '/projects/hints.jpg' },
] as const;
export type Preferences = {
  theme: 'light' | 'dark';
  unlocked: string[];
  character: string | null;
  unlockVersion: number;
};
export const initialPreferences: Preferences = {
  theme: 'light',
  unlocked: ['character-2', 'corporate'],
  character: 'character-2',
  unlockVersion: 3,
};
export const preferenceKey = 'danila-portfolio-v1';
export function readPreferences(raw: string | null): Preferences {
  try {
    const value = JSON.parse(raw || 'null');
    const unlocked = [...initialPreferences.unlocked];
    if ([2, 3].includes(value?.unlockVersion) && Array.isArray(value?.unlocked) && value.unlocked.includes('character-3')) {
      unlocked.push('character-3');
    }
    return {
      unlockVersion: 3,
      theme: value?.theme === 'dark' ? 'dark' : 'light',
      unlocked,
      character: unlocked.includes(value?.character) ? value.character : 'character-2',
    };
  } catch {
    return { ...initialPreferences, unlocked: [...initialPreferences.unlocked] };
  }
}
export function unlockMessage(prefs: Preferences): Preferences {
  return prefs.unlocked.includes('character-3')
    ? prefs
    : { ...prefs, unlocked: [...prefs.unlocked, 'character-3'] };
}
export function applyCharacter(prefs: Preferences, id: string): Preferences {
  return prefs.unlocked.includes(id) && characters.some((c) => c.id === id)
    ? { ...prefs, character: id }
    : prefs;
}

export function unlockContact(prefs: Preferences): Preferences {
  return prefs.unlocked.includes('corporate')
    ? prefs
    : { ...prefs, unlockVersion: 3, unlocked: [...prefs.unlocked, 'corporate'] };
}
