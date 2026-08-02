// src/js/verification.js
//
// Классификация принятого обмена — сверяет то, что ввёл пользователь, с
// тем, что реально передала станция, и возвращает коды ошибок по аналогии
// с логом MorseRunner (DUP/NIL/RST/NR из его Readme.txt).
//
// Чистые функции, без DOM и без побочных эффектов — по правилу CLAUDE.md:
// логика, которую можно вынести в чистую функцию, должна ехать в тесты,
// а не в консоль. Раньше эта сверка (compareExtraInfo) жила прямо в
// app.js::tu() и её результат («correct: true/false») до scoringSystem не
// доходил — из-за этого «Точность» врала. Теперь коды идут в scoring.js.
//
// Дубль (DUP) сюда не входит — он определяется раньше, в
// scoring.js::addQSO(), по множеству уже отработанных позывных, а не по
// содержимому обмена.
//
// Из четырёх кодов MorseRunner в текущем игровом цикле реально достижим
// только один:
//
//  - NR   — неверный числовой номер обмена (серийник/cwopsNumber).
//           Единственный код, который реально возникает в игре сейчас.
//  - EXCH — неверное НЕчисловое поле обмена (имя, область, район, парк).
//           У MorseRunner такого кода нет — у него обмен всегда RST +
//           номер, у нас обмен богаче (CWT — имя/штат, RDA — район,
//           POTA — парк). Это расширение под наши режимы, не
//           терминология MorseRunner — явно помечаю, чтобы не выдавать
//           это за то же самое.
//  - NIL  — позывной не совпал. Структурно недостижим через UI: в
//           app.js::send() QSO переходит в стадию обмена только при
//           'perfect'-совпадении позывного (compareStrings), то есть до
//           tu() позывной уже гарантированно верный. Функция всё равно
//           экспортируется и покрыта тестом — пригодится, когда лог
//           будет пересверяться на сервере независимо от гарантий
//           текущего игрового цикла (см. CONTEST-MODE-PLAN.md, этап 3).
//  - RST  — в Morse Walker нет ни одного режима, где RST вводится
//           пользователем (станция всегда шлёт исправный 5NN, LIDS-
//           поведение из MorseRunner не смоделировано). Код зарезервирован
//           на будущее, сейчас недостижим — так же, как NIL.

const NUMERIC_FIELDS = new Set(['serialNumber', 'cwopsNumber']);

/**
 * Сверка одного поля обмена (серийник, имя, область, район, парк — что
 * угодно, что лежит в конфиге режима как extraInfoFieldKey/Key2).
 *
 * @param {string} fieldKey - ключ поля станции, например 'serialNumber'
 * @param {string} userInput - что ввёл пользователь
 * @param {Object} station - станция с эталонными данными
 * @returns {{ code: 'NR'|'EXCH'|null, html: string, correct: boolean }}
 */
export function classifyExchangeField(fieldKey, userInput, station) {
  if (!fieldKey) return { code: null, html: '', correct: true };

  const expectedValue = station ? station[fieldKey] : undefined;

  if (NUMERIC_FIELDS.has(fieldKey)) {
    const userValInt = parseInt(userInput, 10);

    if (isNaN(userValInt)) {
      return {
        code: 'NR',
        html: `<span class="text-warning">
                <i class="fa-solid fa-triangle-exclamation me-1"></i>
              </span> (${expectedValue})`,
        correct: false,
      };
    }

    const correct = userValInt === Number(expectedValue);
    return {
      code: correct ? null : 'NR',
      html: correct
        ? `<span class="text-success">
           <i class="fa-solid fa-check me-1"></i><strong>${userValInt}</strong>
         </span>`
        : `<span class="text-warning">
           <i class="fa-solid fa-triangle-exclamation me-1"></i>${userValInt}
         </span> (${expectedValue})`,
      correct,
    };
  }

  const upperExpectedValue = String(expectedValue).toUpperCase();
  const upperUserInput = (userInput || '').toUpperCase().trim();

  // Станция без этого поля (например, DX без области) — сверять нечего
  if (upperExpectedValue === '' || upperExpectedValue === 'UNDEFINED') {
    return { code: null, html: 'N/A', correct: true };
  }

  const correct = upperUserInput === upperExpectedValue;
  return {
    code: correct ? null : 'EXCH',
    html: correct
      ? `<span class="text-success">
         <i class="fa-solid fa-check me-1"></i><strong>${upperUserInput}</strong>
       </span>`
      : `<span class="text-warning">
         <i class="fa-solid fa-triangle-exclamation me-1"></i>${upperUserInput}
       </span> (${upperExpectedValue})`,
    correct,
  };
}

/**
 * Сверка позывного — код NIL. См. комментарий в шапке файла: в текущем
 * игровом цикле недостижим через UI, но нужен как чистая функция для
 * серверной пересверки лога (этап 3 плана).
 *
 * @param {string} userCallsign
 * @param {Object} station
 * @returns {{ code: 'NIL'|null, correct: boolean }}
 */
export function classifyCallsign(userCallsign, station) {
  const expected = String(station?.callsign || '')
    .toUpperCase()
    .trim();
  const actual = String(userCallsign || '')
    .toUpperCase()
    .trim();
  const correct = expected !== '' && actual === expected;
  return { code: correct ? null : 'NIL', correct };
}

/**
 * Классификация целого QSO — позывной + оба поля обмена. Дубль сюда не
 * входит (см. верх файла) — это забота scoring.js.
 *
 * @param {Object} params
 * @param {Object} params.station - эталонная станция
 * @param {string} params.userCallsign - позывной, который ввёл пользователь
 * @param {string} [params.fieldKey] - ключ первого поля обмена
 * @param {string} [params.userInput] - ввод по первому полю
 * @param {string} [params.fieldKey2] - ключ второго поля обмена (CWT)
 * @param {string} [params.userInput2] - ввод по второму полю
 * @returns {{ codes: string[], verified: boolean, field1: Object, field2: Object }}
 */
export function classifyQso({
  station,
  userCallsign,
  fieldKey,
  userInput,
  fieldKey2,
  userInput2,
}) {
  const codes = [];

  const callCheck = classifyCallsign(userCallsign, station);
  if (callCheck.code) codes.push(callCheck.code);

  const field1 = classifyExchangeField(fieldKey, userInput, station);
  if (field1.code) codes.push(field1.code);

  const field2 = fieldKey2
    ? classifyExchangeField(fieldKey2, userInput2, station)
    : { code: null, html: '', correct: true };
  if (field2.code) codes.push(field2.code);

  return {
    codes,
    verified: codes.length === 0,
    field1,
    field2,
  };
}
