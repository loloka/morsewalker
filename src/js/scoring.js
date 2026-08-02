// src/js/scoring.js

/**
 * Правила подсчёта по режимам.
 *
 * multipliers — считаются ли множители вообще. Если нет, итоговый счёт
 * равен очкам, и в UI это надо показывать честно, а не умножать на единицу.
 * key — по какому полю станции считается множитель.
 */
const MODE_RULES = {
  single: { points: 1, multipliers: false },
  contest: { points: 2, multipliers: false },
  sst: { points: 2, multipliers: false },
  hst: { points: 1, multipliers: false },
  pota: { points: 1, multipliers: false },
  rda: { points: 1, multipliers: true, key: 'region', bonus: 3 },
  cwt: { points: 1, multipliers: true, key: 'state' },
  wpx: { points: 1, multipliers: true, key: 'prefix' },
};

/**
 * Результат добавления QSO — чтобы app.js мог пометить строку в логе.
 * codes — коды ошибок из verification.js (DUP сюда не входит, см. там же).
 * @typedef {{status: 'ok'|'dupe'|'error', points: number, isNewMultiplier: boolean, codes: string[]}} QsoResult
 */

export class ScoringSystem {
  constructor() {
    this.qsos = 0; // засчитанные (verified) связи
    this.attempted = 0; // все попытки, включая ошибочные и дубли
    this.points = 0; // verified очки
    this.multipliers = 0; // verified мультипликаторы
    // 🆕 Raw — «как если бы каждая непустая попытка (кроме дублей) была
    // принята верно». Это НЕ то же самое, что Raw в MorseRunner — там Raw
    // считается по тому, что реально ввёл оператор в своих полях обмена,
    // и может расходиться с Verified даже по мультипликатору. У нас нет
    // отдельного отслеживания «что ввёл оператор» для каждого поля
    // мультипликатора (region/state и т.п. в qso всегда берутся из
    // истины станции), поэтому Raw — это скорее «потолок счёта при
    // текущем темпе, если бы не было ошибок приёма», посчитанный от той
    // же истины. Дубль вычитается из обоих одинаково — его видно по
    // своему логу сразу, сверка с чужим логом для этого не нужна.
    this.rawPoints = 0;
    this.rawMultipliers = 0;
    this.dupes = 0;
    this.mistakes = 0;
    this.workedCallsigns = new Set();
    this.workedMultipliers = new Set();
    this.rawWorkedMultipliers = new Set();
  }

  /**
   * Добавить QSO.
   *
   * @param {string} mode
   * @param {Object} qso — { callsign, region, state, codes }
   *        codes — массив кодов ошибок от verification.js::classifyQso()
   *        (NR/EXCH/NIL/RST). Пустой массив или отсутствие поля — обмен
   *        принят верно.
   * @returns {QsoResult}
   */
  addQSO(mode, qso) {
    const callsign = qso?.callsign;

    if (!callsign) {
      console.error('❌ Ошибка: нет позывного', qso);
      return { status: 'error', points: 0, isNewMultiplier: false, codes: [] };
    }

    this.attempted++;

    // Дубль: в контестах повторная связь не приносит очков. Проверяем
    // раньше сверки обмена — дубль виден по своему логу сразу, без
    // сверки с чужим (как и в реальном контесте).
    if (this.workedCallsigns.has(callsign)) {
      this.dupes++;
      console.warn(`⚠️ Дубль: ${callsign} — 0 очков`);
      return {
        status: 'dupe',
        points: 0,
        isNewMultiplier: false,
        codes: ['DUP'],
      };
    }

    this.workedCallsigns.add(callsign);

    // 🆕 Raw считаем от той же станции независимо от того, ошибся
    // пользователь в обмене или нет — см. комментарий в конструкторе.
    const rawCalc = this.calculateScore(mode, qso, this.rawWorkedMultipliers);
    this.rawPoints += rawCalc.points;
    if (rawCalc.isNewMultiplier) this.rawMultipliers++;

    const codes = qso.codes || [];

    // Неверно принятый обмен: связь не засчитывается, как в реальном контесте
    if (codes.length > 0) {
      this.mistakes++;
      console.warn(
        `❌ Ошибка приёма (${codes.join(',')}): ${callsign} — QSO не засчитано`
      );
      return { status: 'error', points: 0, isNewMultiplier: false, codes };
    }

    this.qsos++;

    const { points, isNewMultiplier } = this.calculateScore(
      mode,
      qso,
      this.workedMultipliers
    );
    this.points += points;
    if (isNewMultiplier) this.multipliers++;

    console.log(
      `✅ QSO: ${callsign} | +${points} | всего очков: ${this.points} | мульты: ${this.multipliers}`
    );

    return { status: 'ok', points, isNewMultiplier, codes };
  }

  /**
   * Очки и множитель за одну связь.
   * @param {Set} multiplierSet — куда писать отработанные множители
   *        (свой набор для raw и для verified — они не должны смешиваться).
   */
  calculateScore(mode, qso, multiplierSet) {
    const rule = MODE_RULES[mode] || { points: 1, multipliers: false };
    let points = rule.points;
    let isNewMultiplier = false;

    if (rule.multipliers) {
      const value =
        rule.key === 'prefix' ? extractPrefix(qso.callsign) : qso[rule.key];

      if (value && !multiplierSet.has(value)) {
        multiplierSet.add(value);
        isNewMultiplier = true;
        points += rule.bonus || 0;
      }
    }

    return { points, isNewMultiplier };
  }

  /** Считаются ли в этом режиме множители */
  usesMultipliers(mode) {
    return Boolean((MODE_RULES[mode] || {}).multipliers);
  }

  /**
   * Итоговый счёт — Verified (как есть сейчас) и Raw (см. конструктор).
   * Множители умножают очки только там, где они предусмотрены правилами.
   */
  getFinalScore(mode) {
    const withMults = this.usesMultipliers(mode);
    const totalScore = withMults
      ? this.points * (this.multipliers || 1)
      : this.points;
    const rawTotalScore = withMults
      ? this.rawPoints * (this.rawMultipliers || 1)
      : this.rawPoints;

    // Точность считаем от всех попыток, а не от засчитанных связей:
    // иначе ошибки просто исчезают из знаменателя и точность всегда 100%
    const accuracy =
      this.attempted > 0 ? Math.round((this.qsos / this.attempted) * 100) : 100;

    return {
      qsos: this.qsos,
      attempted: this.attempted,
      points: this.points,
      multipliers: this.multipliers,
      usesMultipliers: withMults,
      totalScore,
      rawPoints: this.rawPoints,
      rawMultipliers: this.rawMultipliers,
      rawTotalScore,
      dupes: this.dupes,
      mistakes: this.mistakes,
      accuracy,
    };
  }

  reset() {
    this.qsos = 0;
    this.attempted = 0;
    this.points = 0;
    this.multipliers = 0;
    this.rawPoints = 0;
    this.rawMultipliers = 0;
    this.dupes = 0;
    this.mistakes = 0;
    this.workedCallsigns.clear();
    this.workedMultipliers.clear();
    this.rawWorkedMultipliers.clear();
  }
}

/**
 * Префикс по правилам WPX.
 *
 * Правила:
 *   RA9ABC     → RA9    префикс = всё до последней цифры включительно
 *   N8BJQ      → N8
 *   3DA0RS     → 3DA0
 *   N8BJQ/9    → N9     цифра в суффиксе заменяет цифру префикса
 *   W8/RA9ABC  → W8     префикс из дроби вытесняет основной
 *   G/W8XYZ    → G0     префикс без цифры получает 0
 *   RA9ABC/P   → RA9    служебные суффиксы игнорируются
 *
 * Старый жадный /^[A-Z0-9]+\d/ на дробных позывных давал мусор.
 */
export function extractPrefix(callsign) {
  if (!callsign) return '';

  const call = String(callsign).toUpperCase().trim();

  // Служебные суффиксы на префикс не влияют
  const IGNORED = ['P', 'M', 'MM', 'AM', 'A', 'QRP', 'LH', 'J'];

  const parts = call.split('/').filter(Boolean);
  if (parts.length === 0) return '';

  if (parts.length === 1) return prefixOf(parts[0]);

  // Отбрасываем служебные хвосты: RA9ABC/P, RA9ABC/QRP
  const meaningful = parts.filter((p) => !IGNORED.includes(p));
  if (meaningful.length === 0) return prefixOf(parts[0]);
  if (meaningful.length === 1) return prefixOf(meaningful[0]);

  // Одиночная цифра заменяет цифру в префиксе: N8BJQ/9 → N9
  const digitPart = meaningful.find((p) => /^\d$/.test(p));
  if (digitPart) {
    const base = meaningful.find((p) => p !== digitPart) || '';
    const basePrefix = prefixOf(base);
    return basePrefix.replace(/\d+$/, digitPart);
  }

  // Иначе префиксом становится более короткая часть: W8/RA9ABC → W8
  const [a, b] = meaningful;
  const candidate = a.length <= b.length ? a : b;
  return prefixOf(candidate);
}

/** Префикс одиночного (недробного) позывного */
function prefixOf(call) {
  if (!call) return '';
  // Всё до последней цифры включительно, хвостовые буквы отбрасываем
  const match = call.match(/^(.*\d)[A-Z]*$/);
  if (match) return match[1];
  // Позывной без цифры получает 0 по правилам WPX
  return `${call}0`;
}
