export type Character = {
  id: string;
  name: string;
  video: string | null;
  poster: string | null;
  darkVideo?: string;
  darkPoster?: string;
  darkTransitionVideo?: string;
  darkTransitionPoster?: string;
  unlock: 'message' | null;
};
export const profile = {
  name: 'Данила Плешаков',
  role: 'Дизайнер продукта',
  email: 'ddedu.production@gmail.com',
  telegram: '@daniladedu',
  telegramUrl: 'https://t.me/daniladedu',
  resumeUrl: '/resume',
  defaultVideo: '/videos/corporate-idle-stable.webm' as string | null,
  defaultPoster: '/videos/corporate-idle-stable.png' as string | null,
  darkTransitionVideo: '/videos/corporate-dark-switch.webm',
  darkTransitionPoster: '/videos/corporate-dark-switch.png',
  defaultDarkVideo: '/videos/corporate-dark-idle.webm',
  defaultDarkPoster: '/videos/corporate-dark-idle.png',
};
export const characters: Character[] = [
  { id: 'corporate', name: 'Корпорат', video: '/videos/corporate-idle-stable.webm', poster: '/videos/corporate-idle-stable.png', darkVideo: '/videos/corporate-dark-idle.webm', darkPoster: '/videos/corporate-dark-idle.png', unlock: null },
  { id: 'character-2', name: 'Владивосток 2000', video: '/videos/vladivostok-light-idle.webm', poster: '/videos/vladivostok-light-idle.png', darkVideo: '/videos/vladivostok-dark-idle.webm', darkPoster: '/videos/vladivostok-dark-idle.png', darkTransitionVideo: '/videos/vladivostok-dark-switch.webm', darkTransitionPoster: '/videos/vladivostok-dark-switch.png', unlock: null },
  { id: 'character-3', name: 'Обратно в 1 класс', video: '/videos/school-light-idle.webm', poster: '/videos/school-light-idle.png', darkVideo: '/videos/school-dark-idle-short.webm', darkPoster: '/videos/school-dark-idle-short.png', darkTransitionVideo: '/videos/school-dark-switch-hair.webm', darkTransitionPoster: '/videos/school-dark-switch-hair.png', unlock: 'message' },
];
export const description =
  'Весь последний год работал над улучшением пользовательского опыта при использовании статистики в Avito';
export const projects = [
  { id: 'typer', label: 'Тайпер', image: null },
  { id: 'comparison', label: 'Сравнение\nс конкурентами', image: null },
  { id: 'hints', label: 'Новые подсказки', image: null },
  { id: 'promotion', label: 'Таймлайн продвижения', image: null },
  { id: 'search', label: 'Место в поиске\nв реальном времени', image: null },
  { id: 'a-motion', label: 'А-motion', image: null },
] as const;
export type Preferences = {
  theme: 'light' | 'dark';
  unlocked: string[];
  character: string | null;
  unlockVersion: number;
};
export const initialPreferences: Preferences = {
  theme: 'light',
  unlocked: ['corporate', 'character-2'],
  character: 'corporate',
  unlockVersion: 2,
};
export const preferenceKey = 'danila-portfolio-v1';
export function readPreferences(raw: string | null): Preferences {
  try {
    const value = JSON.parse(raw || 'null');
    const unlocked = [...initialPreferences.unlocked];
    if (value?.unlockVersion === 2 && Array.isArray(value?.unlocked) && value.unlocked.includes('character-3')) {
      unlocked.push('character-3');
    }
    return {
      unlockVersion: 2,
      theme: value?.theme === 'dark' ? 'dark' : 'light',
      unlocked,
      character: unlocked.includes(value?.character) ? value.character : 'corporate',
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
