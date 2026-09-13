import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCharacter,
  initialPreferences,
  readPreferences,
  unlockMessage,
  unlockContact,
} from '../lib/portfolio.ts';

test('Новый посетитель начинает с доступным выбранным +Вайбиком', () => {
  assert.deepEqual(readPreferences(null), initialPreferences);
});
test('Повреждённые настройки не мешают открытию сайта', () => {
  for (const raw of ['{broken', 'null', 'false', '[]', '{"unlocked":42}']) {
    assert.deepEqual(readPreferences(raw), initialPreferences);
  }
});
test('Послание открывает третий стиль один раз и не меняет выбранное видео', () => {
  const once = unlockMessage(initialPreferences);
  assert.deepEqual(once.unlocked, ['character-2', 'corporate', 'character-3']);
  assert.equal(once.character, 'character-2');
  assert.deepEqual(unlockMessage(once), once);
});
test('Закрытый или неизвестный персонаж не может быть применён', () => {
  assert.deepEqual(applyCharacter(initialPreferences, 'character-3'), initialPreferences);
  assert.deepEqual(applyCharacter(initialPreferences, 'unknown'), initialPreferences);
  assert.equal(applyCharacter(initialPreferences, 'corporate').character, 'corporate');
});
test('Выбранный доступный персонаж и тёмная тема сохраняются', () => {
  const next = applyCharacter(
    { ...unlockMessage(initialPreferences), theme: 'dark' },
    'character-3',
  );
  assert.deepEqual(readPreferences(JSON.stringify(next)), next);
});
test('Неизвестные и повторяющиеся сохранённые персонажи отбрасываются', () => {
  const restored = readPreferences(
    JSON.stringify({
      theme: 'other',
      unlocked: ['corporate', 'corporate', 'unknown', 4],
      character: 'character-3',
    }),
  );
  assert.deepEqual(restored, {
    unlockVersion: 3,
    theme: 'light',
    unlocked: ['character-2', 'corporate'],
    character: 'character-2',
  });
});

test('Старые настройки получают доступный +Вайбик без открытия третьего стиля', () => {
  assert.deepEqual(readPreferences(JSON.stringify({ theme: 'dark', unlocked: [], character: null })), {
    unlockVersion: 3, theme: 'dark', unlocked: ['character-2', 'corporate'], character: 'character-2',
  });
});

test('+Вайбик доступен сразу и его выбор сохраняется', () => {
  const next = applyCharacter(initialPreferences, 'character-2');
  assert.equal(next.character, 'character-2');
  assert.deepEqual(readPreferences(JSON.stringify(next)), next);
  assert.deepEqual(readPreferences(JSON.stringify({ unlocked: ['corporate'], character: 'corporate' })).unlocked, ['character-2', 'corporate']);
});

test('Старый автоматически открытый третий стиль закрывается, тема сохраняется', () => {
  const restored = readPreferences(JSON.stringify({theme: 'dark', unlocked: ['corporate', 'character-3'], character: 'character-3'}));
  assert.equal(restored.theme, 'dark');
  assert.equal(restored.character, 'character-2');
  assert.deepEqual(restored.unlocked, ['character-2', 'corporate']);
});

test('Корпорат доступен сразу, включая старые настройки', () => {
  const copied = unlockContact(initialPreferences);
  assert.ok(copied.unlocked.includes('corporate'));
  assert.deepEqual(readPreferences(JSON.stringify(copied)), copied);
  assert.equal(unlockContact(copied), copied);
  assert.deepEqual(readPreferences(JSON.stringify({ unlockVersion: 2, unlocked: ['corporate'], character: 'corporate' })).unlocked, ['character-2', 'corporate']);
});
