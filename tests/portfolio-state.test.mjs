import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCharacter,
  initialPreferences,
  readPreferences,
  unlockMessage,
} from '../lib/portfolio.ts';

test('Новый посетитель начинает с доступным выбранным Корпоратом', () => {
  assert.deepEqual(readPreferences(null), initialPreferences);
});
test('Повреждённые настройки не мешают открытию сайта', () => {
  for (const raw of ['{broken', 'null', 'false', '[]', '{"unlocked":42}']) {
    assert.deepEqual(readPreferences(raw), initialPreferences);
  }
});
test('Послание открывает второй стиль один раз и не меняет выбранное видео', () => {
  const once = unlockMessage(initialPreferences);
  assert.deepEqual(once.unlocked, ['corporate', 'character-2']);
  assert.equal(once.character, 'corporate');
  assert.deepEqual(unlockMessage(once), once);
});
test('Закрытый или неизвестный персонаж не может быть применён', () => {
  assert.deepEqual(applyCharacter(initialPreferences, 'character-2'), initialPreferences);
  assert.deepEqual(applyCharacter(initialPreferences, 'unknown'), initialPreferences);
});
test('Выбранный доступный персонаж и тёмная тема сохраняются', () => {
  const next = applyCharacter(
    { ...unlockMessage(initialPreferences), theme: 'dark' },
    'character-2',
  );
  assert.deepEqual(readPreferences(JSON.stringify(next)), next);
});
test('Неизвестные и повторяющиеся сохранённые персонажи отбрасываются', () => {
  const restored = readPreferences(
    JSON.stringify({
      theme: 'other',
      unlocked: ['corporate', 'corporate', 'character-3', 4],
      character: 'character-2',
    }),
  );
  assert.deepEqual(restored, {
    theme: 'light',
    unlocked: ['corporate'],
    character: 'corporate',
  });
});

test('Старые настройки получают доступный Корпорат без открытия второго стиля', () => {
  assert.deepEqual(readPreferences(JSON.stringify({ theme: 'dark', unlocked: [], character: null })), {
    theme: 'dark', unlocked: ['corporate'], character: 'corporate',
  });
});
