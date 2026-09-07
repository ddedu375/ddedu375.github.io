export type Character = {
  id: string;
  name: string;
  video: string | null;
  poster: string | null;
  unlock: 'message' | null;
};
export const profile = {
  name: 'Данила Плешаков',
  role: 'Дизайнер продукта',
  email: 'ddedu.production@gmail.com',
  telegram: '@daniladedu',
  telegramUrl: 'https://t.me/daniladedu',
  resumeUrl: '/resume',
  defaultVideo: null as string | null,
  defaultPoster: null as string | null,
};
export const characters: Character[] = [
  { id: 'corporate', name: 'Корпорат', video: null, poster: null, unlock: null },
  { id: 'character-2', name: 'Стиль 2', video: null, poster: null, unlock: 'message' },
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
};
export const initialPreferences: Preferences = {
  theme: 'light',
  unlocked: ['corporate'],
  character: 'corporate',
};
export const preferenceKey = 'danila-portfolio-v1';
export function readPreferences(raw: string | null): Preferences {
  try {
    const value = JSON.parse(raw || 'null');
    const unlocked = ['corporate'];
    if (Array.isArray(value?.unlocked) && value.unlocked.includes('character-2')) {
      unlocked.push('character-2');
    }
    return {
      theme: value?.theme === 'dark' ? 'dark' : 'light',
      unlocked,
      character: unlocked.includes(value?.character) ? value.character : 'corporate',
    };
  } catch {
    return { ...initialPreferences, unlocked: ['corporate'] };
  }
}
export function unlockMessage(prefs: Preferences): Preferences {
  return prefs.unlocked.includes('character-2')
    ? prefs
    : { ...prefs, unlocked: [...prefs.unlocked, 'character-2'] };
}
export function applyCharacter(prefs: Preferences, id: string): Preferences {
  return prefs.unlocked.includes(id) && characters.some((c) => c.id === id)
    ? { ...prefs, character: id }
    : prefs;
}
