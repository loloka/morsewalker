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
 * @typedef {{status: 'ok'|'dupe'|'error', points: number, isNewMultiplier: boolean}} QsoResult
 */

export class ScoringSystem {
  constructor() {
    this.qsos = 0; // засчитанные связи
    this.attempted = 0; // все попытки, включая ошибочные и дубли
    this.points = 0;
    this.multipliers = 0;
    this.dupes = 0;
    this.mistakes = 0;
    this.workedCallsigns = new Set();
    this.workedMultipliers = new Set();
  }

  /**
   * Добавить QSO.
   *
   * @param {string} mode
   * @param {Object} qso — { callsign, region, state, hasError }
   *        hasError выставляет app.js, если принятый обмен разошёлся с тем,
   *        что реально передала станция.
   * @returns {QsoResult}
   */
  addQSO(mode, qso) {
    const callsign = qso?.callsign;

    if (!callsign) {
      console.error('❌ Ошибка: нет позывного', qso);
      return { status: 'error', points: 0, isNewMultiplier: false };
    }

    this.attempted++;

    // Дубль: в контестах повторная связь не приносит очков
    if (this.workedCallsigns.has(callsign)) {
      this.dupes++;
      console.warn(`⚠️ Дубль: ${callsign} — 0 очков`);
      return { status: 'dupe', points: 0, isNewMultiplier: false };
    }

    // Неверно принятый обмен: связь не засчитывается, как в реальном контесте
    if (qso.hasError) {
      this.mistakes++;
      console.warn(`❌ Ошибка приёма: ${callsign} — QSO не засчитано`);
      return { status: 'error', points: 0, isNewMultiplier: false };
    }

    this.workedCallsigns.add(callsign);
    this.qsos++;

    const { points, isNewMultiplier } = this.calculateScore(mode, qso);
    this.points += points;

    console.log(
      `✅ QSO: ${callsign} | +${points} | всего очков: ${this.points} | мульты: ${this.multipliers}`
    );

    return { status: 'ok', points, isNewMultiplier };
  }

  /**
   * Очки и множитель за одну связь.
   */
  calculateScore(mode, qso) {
    const rule = MODE_RULES[mode] || { points: 1, multipliers: false };
    let points = rule.points;
    let isNewMultiplier = false;

    if (rule.multipliers) {
      const value =
        rule.key === 'prefix' ? extractPrefix(qso.callsign) : qso[rule.key];

      if (value && !this.workedMultipliers.has(value)) {
        this.workedMultipliers.add(value);
        this.multipliers++;
        isNewMultiplier = true;
        points += rule.bonus || 0;
        console.log(`✨ Новый множитель: ${value} (#${this.multipliers})`);
      }
    }

    return { points, isNewMultiplier };
  }

  /** Считаются ли в этом режиме множители */
  usesMultipliers(mode) {
    return Boolean((MODE_RULES[mode] || {}).multipliers);
  }

  /**
   * Итоговый счёт.
   * Множители умножают очки только там, где они предусмотрены правилами.
   */
  getFinalScore(mode) {
    const withMults = this.usesMultipliers(mode);
    const totalScore = withMults
      ? this.points * (this.multipliers || 1)
      : this.points;

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
    this.dupes = 0;
    this.mistakes = 0;
    this.workedCallsigns.clear();
    this.workedMultipliers.clear();
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
