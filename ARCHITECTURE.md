# Архитектура Morse Walker (Russian Edition)

Документ описывает, как устроено приложение на уровне модулей, потоков данных
и состояния. Обновлять при добавлении режимов и изменении игрового цикла.

---

## 1. Общая картина

Morse Walker — статическое SPA без бэкенда. Вся логика в браузере, звук
синтезируется через Web Audio API, состояние настроек хранится в `localStorage`.

```
                  ┌──────────────────────────────────────┐
                  │            index.html                │
                  │  (форма настроек + таблица + модалки)│
                  └──────────────┬───────────────────────┘
                                 │ DOM id / data-i18n
                                 ▼
┌────────────┐   getInputs()  ┌──────────┐   modes[mode]   ┌───────────┐
│ inputs.js  │◄───────────────┤  app.js  ├────────────────►│ modes.js  │
│ валидация  │                │ игровой  │                 │ сценарии  │
└────────────┘                │   цикл   │                 └───────────┘
                              │          │
      ┌───────────────────────┼──────────┼────────────────────┐
      ▼                       ▼          ▼                    ▼
┌───────────┐        ┌────────────────┐ ┌──────────┐  ┌───────────────┐
│ audio.js  │        │stationGenerator│ │scoring.js│  │localization/  │
│ синтез CW │        │ генерация      │ │ очки     │  │ i18n          │
│ QRN / QSB │        │ позывных       │ │ мульты   │  │ EN / RU       │
└───────────┘        └───────┬────────┘ └──────────┘  └───────────────┘
                             ▼
                   ┌──────────────────┐
                   │ rda-regions.js   │
                   │ russianCallsigns │
                   └──────────────────┘
```

Сборка — Webpack 5. Точка входа `src/js/app.js` (см. `webpack.common.js`),
HTML генерируется `HtmlWebpackPlugin` из `src/index.html`.

---

## 2. Модули

| Файл | Ответственность | Строк |
|---|---|---|
| `src/js/app.js` | Игровой цикл: `cq()`, `send()`, `tu()`, `reset()`, `stop()`. Хранит всё состояние в модульных переменных. Слушатели DOM. | ~1035 |
| `src/js/modes.js` | Декларативные конфиги режимов: `ui` (что показывать) + `logic` (какие фразы передавать). Единственное место, куда добавляется новый режим. | 217 |
| `src/js/audio.js` | Web Audio: генерация точек/тире, Farnsworth, QSB (амплитудная модуляция), QRN (`static.mp3` + фильтры), аудио-«замок» `getAudioLock()`. | 501 |
| `src/js/stationGenerator.js` | `getYourStation()` и `getCallingStation()` — синтез позывного, имени, региона, серийника, тона, скорости, QSB. | 560 |
| `src/js/inputs.js` | Чтение и валидация формы, подсветка невалидных полей (Bootstrap). | 265 |
| `src/js/scoring.js` | `ScoringSystem` + правила режимов `MODE_RULES` + `extractPrefix()` по правилам WPX. | ~205 |
| `src/js/hotkeys.js` | `HotkeyManager` и раскладки `LAYOUTS` (contest / training). | ~165 |
| `src/js/util.js` | Работа с таблицей результатов, `compareStrings()` (точное/частичное совпадение), управление пачкой отвечающих станций. | 652 |
| `src/js/rda-regions.js` | 85 регионов RDA + `isRussianCallsign()`. | 3020 |
| `src/data/russianCallsigns.js` | Справочник реальных российских позывных. | 173 |
| `src/localization/index.js` | `LocalizationManager` — `t(key)`, `setLanguage()`, `updateUI()`. | 349 |
| `src/localization/{en,ru}.js` | Словари переводов. | ~145 |
| `tests/scoring.test.mjs` | Тесты подсчёта очков и правил WPX (`npm test`). | 119 |

---

## 3. Состояние приложения

Всё живёт в модульных переменных `app.js` — глобального стора нет:

```js
currentMode            // 'single' | 'contest' | 'pota' | 'rda' | 'cwt' | 'sst' | 'hst' | 'wpx'
scoringSystem          // экземпляр ScoringSystem, пересоздаётся при reset
inputs                 // снапшот формы на момент CQ
currentStations[]      // пачка станций, отвечающих на CQ (режимы с TU)
currentStation         // одиночная станция (режим single/hst)
activeStationIndex     // индекс станции, с которой ведётся QSO
readyForTU             // разрешено ли нажимать TU
currentStationAttempts // счётчик попыток (идёт в таблицу)
totalContacts          // номер строки в таблице
yourStation            // твоя станция + morse player
```

Персистентность (`localStorage`): `yourCallsign`, `yourName`, `yourState`,
`yourSpeed`, `yourSidetone`, `yourVolume`, `mode`, `language`.

---

## 4. Игровой цикл

Два разных сценария, разделённые флагом `modes[mode].logic.showTuStep`.

### 4.1 Одиночный режим (`showTuStep: false`) — `single`, `hst`

```
CQ → генерируется 1 станция → она передаёт позывной
   → пользователь вводит позывной → Send
       ├── perfect  → обмен → подпись → строка в таблицу → следующая станция
       ├── partial  → станция повторяет позывной
       └── miss     → станция повторяет позывной
```
Кнопка TU скрыта, QSO закрывается автоматически внутри `send()` — там же
вызывается `scoringSystem.addQSO()`.

### 4.2 Контестный режим (`showTuStep: true`) — остальные

```
CQ → addStations() создаёт пачку → все отвечают одновременно (pile-up)
   → ввод позывного → Send
       ├── AGN?/?  → вся пачка отвечает снова
       ├── QRS     → пачка снижает скорость (Farnsworth −6 wpm) и отвечает
       ├── partial → отвечают только частично совпавшие
       └── perfect → твой обмен → их обмен → readyForTU = true
   → ввод принятого номера/региона в infoField → TU
       → твоя подпись → их подпись
       → строка в таблицу (сверка принятого с реальным)
       → scoringSystem.addQSO(currentMode, qso)
       → станция удаляется из пачки, с вероятностью 40% добавляется новая
```

### 4.3 ESM — Enter Sends Message

Стадия QSO хранится в `qsoState` (`QSO_STATE.IDLE | CQ_SENT | READY_FOR_TU`),
переходы делает `setQsoState()`, она же обновляет подсказку `#qsoHint`.
`esmEnter()` смотрит на стадию и решает, что отправить:

```
IDLE / CQ_SENT, поле позывного пустое → cq()
IDLE / CQ_SENT, позывной введён       → send()
READY_FOR_TU                          → tu()
```

Enter на всех трёх полях ввода идёт через `esmEnter()`. Кнопки CQ / Send / TU
работают напрямую и стадию не спрашивают — они остаются «ручным» режимом.

Стадии `EXCHANGE_SENT` намеренно нет: их обмен звучит сразу за нашим, отдельного
состояния не возникает. Понадобится, если появится задержка ответа станции.

### 4.4 Аудио-замок

`getAudioLock()` / `updateAudioLock(time)` — глобальная блокировка. Пока
проигрывается посылка, `cq()`, `send()` и `tu()` выходят сразу. Это
предохранитель от наложения передач, но он же означает: **пока идёт передача,
пользователь ничего не может сделать** (в реальном контесте оператор может
прервать себя).

---

## 5. Конфигурация режима

Единый контракт в `modes.js`:

```js
mode: {
  ui: {
    showTuButton, showInfoField, infoFieldPlaceholder,
    showInfoField2, infoField2Placeholder,
    tableExtraColumn, extraColumnHeader, resultsHeader
  },
  logic: {
    showTuStep,            // контестный цикл или одиночный
    requiresInfoField,     // нужно ли принимать обмен
    extraInfoFieldKey,     // какое поле станции сверять ('serialNumber' | 'region' | 'name' ...)
    extraInfoFieldKey2,
    cqMessage(your, their, arb),
    myExchange(your, their, arb),    // обмен без его позывного — для F2 / Insert
    yourExchange(your, their, arb),  // его позывной + обмен
    theirExchange(your, their, arb),
    yourSignoff(your, their, arb),
    theirSignoff(your, their, arb)
  }
}
```

`arb` — «произвольное» значение, которое `tu()` подставляет из `infoField`
для режимов `sst`, `pota`, `rda`.

Экспортируются также `modeLogicConfig` / `modeUIConfig` для обратной
совместимости со старым кодом.

**Чтобы добавить режим:** объект в `modes.js` (включая `myExchange` — обмен
без позывного корреспондента, его использует F2 и Insert) → радиокнопка в
`index.html` (`name="mode"`, `value=<id>`) → строка в `MODE_RULES`
(`scoring.js`) → ключи в `localization/{en,ru}.js` + вызов `updateLabel()` в
`localization/index.js`.

---

## 6. Подсчёт очков

`ScoringSystem` (`scoring.js`). Правила режимов вынесены в таблицу
`MODE_RULES` — очки за связь, считаются ли множители и по какому полю:

| Режим | Очки | Множители |
|---|---|---|
| `contest`, `sst` | 2 | нет |
| `single`, `pota`, `hst` | 1 | нет |
| `rda` | 1 (+3 за новый район) | по району |
| `cwt` | 1 | по региону |
| `wpx` | 1 | по префиксу |

`addQSO(mode, qso)` возвращает `{ status, points, isNewMultiplier }`, где
`status` — `ok` / `dupe` / `error`. Именно он определяет, как `app.js`
пометит строку в логе, поэтому счёт и таблица не расходятся.

Правила засчитывания:
- **дубль** — повторный позывной, 0 очков, строка помечается `DUPE`;
- **ошибка** — принятый обмен разошёлся с переданным (`qso.hasError`,
  считается в `app.js::compareExtraInfo()`), связь не засчитывается;
- **точность** = засчитанные связи / все попытки.

`getFinalScore(mode)` умножает очки на множители только там, где они
предусмотрены правилами; иначе итог равен очкам, а в UI стоит прочерк.

`extractPrefix()` реализует правила WPX, включая дробные позывные
(`N8BJQ/9` → `N9`, `W8/RA9ABC` → `W8`, `G/W8XYZ` → `G0`). Покрыт тестами.

## 7. Аудио

- Каждая станция получает свой `morsePlayer` через `createMorsePlayer(station)`
  с индивидуальными частотой, громкостью, WPM и QSB.
- `playSentence(text, startTime)` возвращает время окончания посылки — вся
  оркестровка диалога строится на этих таймстемпах (`+0.25`, `+0.5`, `+Math.random()`).
- QRN — зацикленный `static.mp3` с регулируемой интенсивностью
  (`updateStaticIntensity()`), четыре уровня.
- QSB — низкочастотная модуляция усиления, применяется к проценту станций
  (`qsbPercentage`).
- Farnsworth — увеличенные межзнаковые паузы при сохранении скорости знаков.

---

## 8. Локализация

`LocalizationManager` работает в двух режимах одновременно:

1. **Декларативно** — атрибуты `data-i18n="ключ.путь"` в HTML,
   `updateUI()` проходит по всем и подставляет `textContent` (или `placeholder`
   для `input`/`textarea`).
2. **Императивно** — длинная цепочка `document.querySelector(...)` в
   `updateUI()` и `updateHelpModal()` для элементов без `data-i18n`,
   включая поиск по подстроке текста (`label.textContent.includes('QRN')`).

Второй путь — основной источник хрупкости локализации. Целевое состояние:
всё через `data-i18n`, императивную часть удалить.

---

## 9. Сборка и деплой

```bash
npm install
npm start          # webpack-dev-server, открывает браузер
npm run build      # прод-сборка в dist/ + jsdoc
npm run format     # prettier по src/**
npm test           # node --test по tests/**
```

- `husky` + `pre-commit` прогоняют форматирование.
- Прод-версия: https://morse.r9o.ru
- При непустом позывном и не-localhost хосте `app.js` шлёт POST на
  `https://stats.<hostname>/api/submit` с `{ mode, callsign }` — телеметрия
  Cloudflare. Ошибки глушатся.

---

## 10. Апстрим

Форк от [sc0tfree/morsewalker](https://github.com/sc0tfree/morsewalker) (W6NYC).
Добавлено в этом форке: локализация RU, режим RDA, российские позывные,
режимы HST/WPX, система подсчёта очков, Scoreboard, горячие клавиши.
