// tests/scoring.test.mjs
//
// Тесты чистых функций подсчёта. Запуск: npm test
// Используется встроенный в Node тест-раннер — без зависимостей,
// чтобы тесты работали сразу после git clone.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ScoringSystem, extractPrefix } from '../src/js/scoring.js';

test('extractPrefix: обычные позывные', () => {
  assert.equal(extractPrefix('RA9ABC'), 'RA9');
  assert.equal(extractPrefix('N8BJQ'), 'N8');
  assert.equal(extractPrefix('R9OGL'), 'R9');
  assert.equal(extractPrefix('RZ3DVP'), 'RZ3');
  assert.equal(extractPrefix('UA0ABC'), 'UA0');
  assert.equal(extractPrefix('4X4ABC'), '4X4');
  assert.equal(extractPrefix('3DA0RS'), '3DA0');
});

test('extractPrefix: дробные позывные по правилам WPX', () => {
  // Цифра в суффиксе заменяет цифру префикса
  assert.equal(extractPrefix('N8BJQ/9'), 'N9');
  assert.equal(extractPrefix('R9O/3'), 'R3');
  // Префикс из дроби вытесняет основной
  assert.equal(extractPrefix('W8/RA9ABC'), 'W8');
  // Префикс без цифры получает 0
  assert.equal(extractPrefix('G/W8XYZ'), 'G0');
});

test('extractPrefix: служебные суффиксы игнорируются', () => {
  assert.equal(extractPrefix('RA9ABC/P'), 'RA9');
  assert.equal(extractPrefix('UA3ABC/QRP'), 'UA3');
  assert.equal(extractPrefix('R9OGL/M'), 'R9');
});

test('extractPrefix: мусор на входе не роняет функцию', () => {
  assert.equal(extractPrefix(''), '');
  assert.equal(extractPrefix(null), '');
  assert.equal(extractPrefix(undefined), '');
});

test('дубль не приносит очков и помечается статусом', () => {
  const s = new ScoringSystem();
  s.addQSO('contest', { callsign: 'K1ABC' });
  const dupe = s.addQSO('contest', { callsign: 'K1ABC' });

  assert.equal(dupe.status, 'dupe');
  assert.equal(dupe.points, 0);
  assert.equal(s.qsos, 1, 'дубль не увеличивает счётчик связей');
  assert.equal(s.dupes, 1);
});

test('неверно принятый обмен не засчитывается и растит счётчик ошибок', () => {
  const s = new ScoringSystem();
  const bad = s.addQSO('contest', { callsign: 'K1ABC', codes: ['NR'] });

  assert.equal(bad.status, 'error');
  assert.equal(bad.points, 0);
  assert.deepEqual(bad.codes, ['NR']);
  assert.equal(s.qsos, 0);
  assert.equal(s.mistakes, 1);
});

test('точность считается от всех попыток, а не от засчитанных связей', () => {
  const s = new ScoringSystem();
  s.addQSO('contest', { callsign: 'K1ABC' });
  s.addQSO('contest', { callsign: 'W2DEF', codes: ['NR'] });

  // Это и был баг: раньше mistakes не рос ниоткуда и точность всегда была 100%
  assert.equal(s.getFinalScore('contest').accuracy, 50);
});

test('дубль помечается кодом DUP', () => {
  const s = new ScoringSystem();
  s.addQSO('contest', { callsign: 'K1ABC' });
  const dupe = s.addQSO('contest', { callsign: 'K1ABC' });

  assert.deepEqual(dupe.codes, ['DUP']);
});

test('Raw-счёт учитывает попытки с ошибкой обмена, Verified — нет', () => {
  const s = new ScoringSystem();
  s.addQSO('contest', { callsign: 'K1ABC' }); // верно: +2
  s.addQSO('contest', { callsign: 'W2DEF', codes: ['NR'] }); // ошибка: raw +2, verified +0

  const score = s.getFinalScore('contest');
  assert.equal(score.points, 2, 'verified не считает попытку с ошибкой');
  assert.equal(score.rawPoints, 4, 'raw считает обе попытки как верные');
});

test('Raw-множитель не путается с Verified-множителем', () => {
  const s = new ScoringSystem();
  // Единственная связь с этим районом — с ошибкой в обмене.
  // Raw даёт мультипликатор и бонус, Verified — нет (связь не засчитана).
  const bad = s.addQSO('rda', {
    callsign: 'R9OGL',
    region: 'TL-27',
    codes: ['EXCH'],
  });

  assert.equal(bad.status, 'error');
  const score = s.getFinalScore('rda');
  assert.equal(score.multipliers, 0, 'verified: район не подтверждён');
  assert.equal(
    score.rawMultipliers,
    1,
    'raw: район засчитан бы, будь обмен верным'
  );
  assert.equal(score.rawPoints, 4, '1 очко + 3 бонус за новый район, по-raw');
});

test('RDA: новый регион даёт множитель и бонус', () => {
  const s = new ScoringSystem();
  const first = s.addQSO('rda', { callsign: 'R9OGL', region: 'TL-27' });
  const second = s.addQSO('rda', { callsign: 'RZ3DVP', region: 'TL-27' });

  assert.equal(first.isNewMultiplier, true);
  assert.equal(first.points, 4, '1 очко + 3 бонус за новый регион');
  assert.equal(second.isNewMultiplier, false);
  assert.equal(second.points, 1, 'регион уже был — только базовое очко');
  assert.equal(s.multipliers, 1);
});

test('WPX: множители считаются по префиксам', () => {
  const s = new ScoringSystem();
  s.addQSO('wpx', { callsign: 'RA9ABC' });
  s.addQSO('wpx', { callsign: 'RA9XYZ' }); // тот же префикс RA9
  s.addQSO('wpx', { callsign: 'K1ABC' }); // новый префикс K1

  assert.equal(s.multipliers, 2);
});

test('в режимах без множителей итог равен очкам, а не очкам × 1', () => {
  const s = new ScoringSystem();
  s.addQSO('contest', { callsign: 'K1ABC' });
  s.addQSO('contest', { callsign: 'W2DEF' });

  const score = s.getFinalScore('contest');
  assert.equal(score.usesMultipliers, false);
  assert.equal(score.points, 4);
  assert.equal(score.totalScore, 4);
});

test('reset обнуляет всё, включая множители и историю позывных', () => {
  const s = new ScoringSystem();
  s.addQSO('rda', { callsign: 'R9OGL', region: 'TL-27' });
  s.reset();

  assert.equal(s.qsos, 0);
  assert.equal(s.points, 0);
  assert.equal(s.multipliers, 0);
  assert.equal(s.attempted, 0);
  // Позывной должен снова считаться новым, а не дублем
  assert.equal(
    s.addQSO('rda', { callsign: 'R9OGL', region: 'TL-27' }).status,
    'ok'
  );
});
