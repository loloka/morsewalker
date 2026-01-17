// src/js/scoring.js

export class ScoringSystem {
  constructor() {
    this.qsos = 0; // ✅ Счётчик QSO
    this.points = 0; // ✅ Очки
    this.multipliers = 0; // ✅ Число (не Set!)
    this.dupes = 0;
    this.mistakes = 0;
    this.workedCallsigns = new Set();
    this.workedMultipliers = new Set(); 
  }

  /**
   * ✅ Метод addQSO (требуется в app.js)
   */
  addQSO(mode, qso) {
  const callsign = qso.callsign;

  // 🛡️ Проверка: есть ли позывной?
  if (!callsign) {
    console.error('❌ Ошибка: нет позывного', qso);
    return;
  }

    // Проверка на дубль
    if (this.workedCallsigns.has(callsign)) {
      this.dupes++;
      console.warn(`⚠️ Дубль: ${callsign}`);
      return;
    }

    this.workedCallsigns.add(callsign);
    this.qsos++;

    // Подсчёт очков
    const qsoPoints = this.calculateScore(mode, qso);
    this.points += qsoPoints;

    console.log(
      `✅ QSO: ${callsign} | Очки: ${this.points} | Мульты: ${this.multipliers}`
    );
  }

  /**
   * Подсчёт очков по режиму
   */
  calculateScore(mode, qso) {
    let points = 0;

    switch (mode) {
      case 'contest':
      case 'sst':
        points = 2;
        break;

      case 'rda':
        points = 1;
        if (qso.region && !this.workedMultipliers.has(qso.region)) {
          this.workedMultipliers.add(qso.region);
          this.multipliers++;
          points += 3; // Бонус за новый регион
          console.log(`✅ RDA: Новый регион ${qso.region} (+3 бонус)`);
        } else {
          console.log(`ℹ️ RDA: Регион ${qso.region} уже был`);
        }
        break;

      case 'cwt':
        points = 1;
        if (qso.state && !this.workedMultipliers.has(qso.state)) {
          this.workedMultipliers.add(qso.state);
          this.multipliers++;
        }
        break;

      case 'wpx':
      points = 1;
      const prefix = this.extractPrefix(qso.callsign);
      console.log(`🔍 WPX: Извлечён префикс "${prefix}" из ${qso.callsign}`);
      
      if (!this.workedMultipliers.has(prefix)) {
        this.workedMultipliers.add(prefix);
        this.multipliers++;
        console.log(`✅ WPX: Новый префикс ${prefix} (мульт #${this.multipliers})`);
      } else {
        console.log(`ℹ️ WPX: Префикс ${prefix} уже был`);
      }
      break;

      default:
        points = 1;
    }

    return points;
  }

  /**
   * Штраф за ошибки
   */
  recordMistake() {
    this.mistakes++;
    this.points = Math.max(0, this.points - 1);
  }

  /**
   * Финальный счёт
   */
  getFinalScore() {
    const totalScore = this.points * (this.multipliers || 1);
    return {
      qsos: this.qsos,
      points: this.points,
      multipliers: this.multipliers,
      totalScore: totalScore,
      dupes: this.dupes,
      mistakes: this.mistakes,
    };
  }

  /**
   * Извлечение префикса для WPX
   */
  extractPrefix(callsign) {
    const match = callsign.match(/^[A-Z0-9]+\d/);
    return match ? match[0] : callsign;
  }

  /**
   * Сброс счёта
   */
  reset() {
    this.qsos = 0;
    this.points = 0;
    this.multipliers = 0;
    this.dupes = 0;
    this.mistakes = 0;
    this.workedCallsigns.clear();
    this.workedMultipliers.clear();
  }
}
