// tests/verification.test.mjs
//
// Тесты классификации обмена — по кейсу на каждый код (NR/EXCH/NIL) плюс
// граничные случаи. RST не тестируется отдельно: в текущей игре его
// негде получить (нет режима, где RST вводится пользователем) — см.
// комментарий в шапке src/js/verification.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyExchangeField,
  classifyCallsign,
  classifyQso,
} from '../src/js/verification.js';

test('classifyExchangeField: верный серийный номер', () => {
  const result = classifyExchangeField('serialNumber', '5', {
    serialNumber: '5',
  });
  assert.equal(result.code, null);
  assert.equal(result.correct, true);
});

test('classifyExchangeField: неверный серийный номер даёт NR', () => {
  const result = classifyExchangeField('serialNumber', '7', {
    serialNumber: '5',
  });
  assert.equal(result.code, 'NR');
  assert.equal(result.correct, false);
});

test('classifyExchangeField: нечисловой ввод в числовое поле — тоже NR', () => {
  const result = classifyExchangeField('serialNumber', 'ABC', {
    serialNumber: '5',
  });
  assert.equal(result.code, 'NR');
  assert.equal(result.correct, false);
});

test('classifyExchangeField: числовое поле сверяется как число, не как строка', () => {
  // '05' и 5 — один и тот же номер, ведущий ноль не должен ломать сверку
  const result = classifyExchangeField('serialNumber', '05', {
    serialNumber: 5,
  });
  assert.equal(result.correct, true);
});

test('classifyExchangeField: верное текстовое поле (регион/область/парк)', () => {
  const result = classifyExchangeField('region', 'tl-27', {
    region: 'TL-27',
  });
  assert.equal(result.code, null, 'регистр не должен иметь значения');
  assert.equal(result.correct, true);
});

test('classifyExchangeField: неверное текстовое поле даёт EXCH', () => {
  const result = classifyExchangeField('region', 'MO-01', {
    region: 'TL-27',
  });
  assert.equal(result.code, 'EXCH');
  assert.equal(result.correct, false);
});

test('classifyExchangeField: пустое ожидаемое значение — сверять нечего, N/A', () => {
  const result = classifyExchangeField('park', '', { park: undefined });
  assert.equal(result.code, null);
  assert.equal(result.correct, true);
  assert.equal(result.html, 'N/A');
});

test('classifyExchangeField: пустой fieldKey — нет проверки вообще', () => {
  const result = classifyExchangeField(null, 'что угодно', {});
  assert.equal(result.code, null);
  assert.equal(result.correct, true);
});

test('classifyCallsign: точное совпадение', () => {
  const result = classifyCallsign('R9OGL', { callsign: 'R9OGL' });
  assert.equal(result.code, null);
  assert.equal(result.correct, true);
});

test('classifyCallsign: регистр и пробелы не влияют', () => {
  const result = classifyCallsign('  r9ogl  ', { callsign: 'R9OGL' });
  assert.equal(result.correct, true);
});

test('classifyCallsign: несовпадение даёт NIL', () => {
  // В текущем игровом цикле недостижимо через UI (см. комментарий в
  // verification.js), но как чистая функция обязано работать верно —
  // пригодится для серверной пересверки лога (этап 3 плана).
  const result = classifyCallsign('R9OGL', { callsign: 'RZ3DVP' });
  assert.equal(result.code, 'NIL');
  assert.equal(result.correct, false);
});

test('classifyCallsign: пустой позывной станции — не считаем "совпадением" пустой строки', () => {
  const result = classifyCallsign('', { callsign: '' });
  assert.equal(result.code, 'NIL');
});

test('classifyQso: полностью верный обмен — verified, без кодов', () => {
  const station = { callsign: 'R9OGL', serialNumber: '5', region: 'TL-27' };
  const result = classifyQso({
    station,
    userCallsign: 'R9OGL',
    fieldKey: 'serialNumber',
    userInput: '5',
  });
  assert.deepEqual(result.codes, []);
  assert.equal(result.verified, true);
});

test('classifyQso: ошибка в номере обмена — код NR, verified = false', () => {
  const station = { callsign: 'R9OGL', serialNumber: '5' };
  const result = classifyQso({
    station,
    userCallsign: 'R9OGL',
    fieldKey: 'serialNumber',
    userInput: '9',
  });
  assert.deepEqual(result.codes, ['NR']);
  assert.equal(result.verified, false);
});

test('classifyQso: CWT — оба поля обмена сверяются независимо', () => {
  const station = { callsign: 'K1ABC', name: 'JOHN', state: 'CA' };
  const result = classifyQso({
    station,
    userCallsign: 'K1ABC',
    fieldKey: 'name',
    userInput: 'JOHN',
    fieldKey2: 'state',
    userInput2: 'TX', // неверно
  });
  assert.deepEqual(result.codes, ['EXCH']);
});

test('classifyQso: может накопить несколько кодов сразу', () => {
  const station = { callsign: 'K1ABC', name: 'JOHN', state: 'CA' };
  const result = classifyQso({
    station,
    userCallsign: 'W2XYZ', // не совпал позывной
    fieldKey: 'name',
    userInput: 'PETE', // не совпало имя
    fieldKey2: 'state',
    userInput2: 'CA', // это верно
  });
  assert.deepEqual(result.codes.sort(), ['EXCH', 'NIL']);
});
