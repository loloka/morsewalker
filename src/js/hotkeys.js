// src/js/hotkeys.js
//
// ⌨️ Менеджер горячих клавиш.
//
// Две раскладки:
//   contest  — стандарт контест-логгеров (Morse Runner, N1MM, DXLog).
//              Именно эти клавиши используются в живом эфире, поэтому
//              привыкать надо сразу к ним.
//   training — мягкая раскладка для новичков: AGN? и QRS под рукой.
//
// Enter здесь НЕ обрабатывается: он висит на полях ввода в app.js.
// Раньше обработчик был в обоих местах и send() вызывался дважды.

/**
 * Описание раскладок. Используется и менеджером, и UI-подсказкой.
 * action — имя команды, которую исполнит app.js через колбэки.
 */
export const LAYOUTS = {
  contest: {
    labelKey: 'hotkeys.contestMode',
    keys: [
      { key: 'F1', action: 'cq', labelKey: 'hotkeys.cq' },
      { key: 'F2', action: 'myExchange', labelKey: 'hotkeys.myExchange' },
      { key: 'F3', action: 'tu', labelKey: 'hotkeys.tu' },
      { key: 'F4', action: 'myCall', labelKey: 'hotkeys.myCall' },
      { key: 'F5', action: 'hisCall', labelKey: 'hotkeys.hisCall' },
      { key: 'F7', action: 'question', labelKey: 'hotkeys.question' },
      { key: 'F8', action: 'agn', labelKey: 'hotkeys.agn' },
      { key: 'F12', action: 'wipe', labelKey: 'hotkeys.wipe' },
      { key: 'Insert', action: 'hisCallExchange', labelKey: 'hotkeys.insert' },
      { key: 'Enter', action: null, labelKey: 'hotkeys.send' },
      { key: 'Esc', action: 'stop', labelKey: 'hotkeys.stop' },
      { key: '+ / -', action: null, labelKey: 'hotkeys.speed' },
    ],
  },

  training: {
    labelKey: 'hotkeys.trainingMode',
    keys: [
      { key: 'F1', action: 'cq', labelKey: 'hotkeys.cq' },
      { key: 'F2', action: 'agn', labelKey: 'hotkeys.agn' },
      { key: 'F3', action: 'qrs', labelKey: 'hotkeys.qrs' },
      { key: 'F4', action: 'myCall', labelKey: 'hotkeys.myCall' },
      { key: 'F12', action: 'wipe', labelKey: 'hotkeys.wipe' },
      { key: 'Enter', action: null, labelKey: 'hotkeys.send' },
      { key: 'Shift+Enter', action: 'tu', labelKey: 'hotkeys.tu' },
      { key: 'Esc', action: 'stop', labelKey: 'hotkeys.stop' },
      { key: '+ / -', action: null, labelKey: 'hotkeys.speed' },
    ],
  },
};

/** Поля, ввод в которые не должен перехватываться клавишами +/- */
const TEXT_INPUT_TYPES = ['text', 'number', 'search', 'tel', 'url', 'email'];

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || target.isContentEditable) return true;
  if (tag !== 'INPUT') return false;
  return TEXT_INPUT_TYPES.includes((target.type || 'text').toLowerCase());
}

export class HotkeyManager {
  /**
   * @param {Object} elements — DOM-элементы кнопок и полей
   * @param {Object} actions  — колбэки из app.js: { cq, tu, stop, wipe,
   *                            sendMacro(name), adjustSpeed(delta) }
   */
  constructor(elements, actions) {
    this.el = elements || {};
    this.actions = actions || {};
    this.layout = 'contest';
    this.enabled = true;

    this.handleKeydown = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.handleKeydown);
  }

  /** Переключить раскладку: 'contest' | 'training' */
  setLayout(name) {
    if (!LAYOUTS[name]) {
      console.warn(`⚠️ Неизвестная раскладка: ${name}`);
      return;
    }
    this.layout = name;
    console.log(`⌨️ Раскладка: ${name}`);
  }

  getLayout() {
    return this.layout;
  }

  handleKeydown(e) {
    if (!this.enabled) return;

    // Удержание клавиши не должно слать поток команд
    if (e.repeat) return;

    // Escape работает всегда и везде
    if (e.key === 'Escape') {
      e.preventDefault();
      this.run('stop');
      return;
    }

    // Скорость: +/- только вне текстовых полей, иначе не набрать «-» в обмене
    if ((e.key === '+' || e.key === '=') && !isTypingTarget(e.target)) {
      e.preventDefault();
      this.actions.adjustSpeed?.(1);
      return;
    }
    if (e.key === '-' && !isTypingTarget(e.target)) {
      e.preventDefault();
      this.actions.adjustSpeed?.(-1);
      return;
    }

    // Shift+Enter → TU (только в обучающей раскладке; в контестной TU на F3)
    if (e.key === 'Enter' && e.shiftKey && this.layout === 'training') {
      e.preventDefault();
      this.run('tu');
      return;
    }

    // Insert — позывной корреспондента + обмен одной посылкой
    if (e.key === 'Insert') {
      e.preventDefault();
      this.run('hisCallExchange');
      return;
    }

    // Функциональные клавиши — работают при любом фокусе, как в логгерах.
    // Комбинации с модификаторами пропускаем: Alt+F4, Ctrl+F5 и т.п. — не наши.
    if (
      /^F([1-9]|1[0-2])$/.test(e.key) &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey
    ) {
      const binding = LAYOUTS[this.layout].keys.find((k) => k.key === e.key);
      if (!binding || !binding.action) return;
      // preventDefault обязателен: F1 — справка браузера, F3 — поиск, F5 — перезагрузка
      e.preventDefault();
      this.run(binding.action);
    }
  }

  run(action) {
    const a = this.actions;
    switch (action) {
      case 'cq':
        a.cq?.();
        break;
      case 'tu':
        a.tu?.();
        break;
      case 'stop':
        a.stop?.();
        break;
      case 'wipe':
        a.wipe?.();
        break;
      default:
        a.sendMacro?.(action);
    }
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  }
}
