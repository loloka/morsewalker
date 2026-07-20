// localization/index.js
import { en } from './en.js';
import { ru } from './ru.js';

class LocalizationManager {
  constructor() {
    this.currentLang = localStorage.getItem('language') || 'en';
    this.translations = { en, ru };
  }

  setLanguage(lang) {
    if (!this.translations[lang]) {
      console.error(`Language ${lang} not found`);
      return;
    }

    this.currentLang = lang;
    localStorage.setItem('language', lang);

    console.log(`🌍 Switching to ${lang.toUpperCase()}`);

    // Обновляем активную кнопку
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    this.updateUI();
  }

  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  }

  updateUI() {
    console.log('✅ Updating UI...');

    // 1. Обновляем все элементы с data-i18n
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      if (translation && translation !== key) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });

    // 2. Заголовок и подзаголовок
    const title = document.querySelector('h1.mb-0');
    if (title) {
      for (let node of title.childNodes) {
        if (node.nodeType === 3) {
          node.textContent = this.t('title') + ' ';
          break;
        }
      }
    }

    const subtitle = document.querySelector('.fw-bold.fst-italic');
    if (subtitle) subtitle.textContent = this.t('subtitle');

    // 3. Режим
    const modeHeader = document.querySelector(
      '.d-flex.flex-column.flex-sm-row h3'
    );
    if (modeHeader) modeHeader.textContent = this.t('mode');

    // 4. Режимы работы
    this.updateLabel('modeSingle', 'modes.singleCaller');
    this.updateLabel('modeContest', 'modes.basicContest');
    this.updateLabel('modePota', 'modes.potaActivator');
    this.updateLabel('modeRda', 'modes.rda');
    this.updateLabel('modeCwt', 'modes.cwt');
    this.updateLabel('modeSst', 'modes.k1usnSST');
    this.updateModeLabelWithBadge('modeHst', 'modes.hst');
    this.updateModeLabelWithBadge('modeWpx', 'modes.wpx');

    // 5. Настройки вашей станции
    const yourStationTitle = document.querySelector('#headingYourStation h5');
    if (yourStationTitle)
      yourStationTitle.textContent = this.t('yourStation.title');

    this.updateLabelByFor('yourCallsign', 'yourStation.callsign');
    this.updateLabelByFor('yourName', 'yourStation.firstName');
    this.updateLabelByFor('yourState', 'yourStation.state');
    this.updateLabelByFor('yourSpeed', 'yourStation.speed');
    this.updateLabelByFor('yourSidetone', 'yourStation.sidetone');
    this.updateLabelByFor('yourVolume', 'yourStation.sidetoneVolume');

    // 6. Настройки отвечающих станций
    const respondingTitle = document.querySelector(
      '#headingRespondingStationSettings h5'
    );
    if (respondingTitle)
      respondingTitle.textContent = this.t('respondingStation.title');

    this.updateLabelByFor('maxStations', 'respondingStation.maxStations');
    this.updateLabelByFor('minSpeed', 'respondingStation.minSpeed');
    this.updateLabelByFor('maxSpeed', 'respondingStation.maxSpeed');
    this.updateLabelByFor(
      'farnsworthSpeed',
      'respondingStation.effectiveSpeed'
    );
    this.updateLabelByFor('minTone', 'respondingStation.minTone');
    this.updateLabelByFor('maxTone', 'respondingStation.maxTone');
    this.updateLabelByFor('minVolume', 'respondingStation.minVolume');
    this.updateLabelByFor('maxVolume', 'respondingStation.maxVolume');
    this.updateLabelByFor('minWait', 'respondingStation.minWait');
    this.updateLabelByFor('maxWait', 'respondingStation.maxWait');

    // 7. Эффекты
    const effectsTitle = document.querySelector('#headingEffects h5');
    if (effectsTitle) effectsTitle.textContent = this.t('effects.title');

    // QRN метка заголовка
    const qrnLabels = document.querySelectorAll('.form-label');
    qrnLabels.forEach((label) => {
      if (
        label.textContent.includes('QRN') ||
        label.textContent.includes('Atmospheric')
      ) {
        label.textContent = this.t('effects.qrn');
      }
    });

    // QRN уровни
    this.updateLabel('qrnOff', 'effects.off');
    this.updateLabel('qrnNormal', 'effects.normal');
    this.updateLabel('qrnModerate', 'effects.moderate');
    this.updateLabel('qrnHeavy', 'effects.heavy');

    // QSB метка
    const qsbLabel = document.getElementById('qsbLabel');
    if (qsbLabel) {
      const icon = qsbLabel.querySelector('i');
      const iconClass = icon
        ? icon.className
        : 'fa-regular fa-circle-xmark me-2';
      qsbLabel.innerHTML = `<i class="${iconClass}"></i>${this.t('effects.qsb')}`;
    }

    // Stations with QSB
    const qsbPercentageLabel = document.querySelector(
      'label[for="qsbPercentage"]'
    );
    if (qsbPercentageLabel) {
      const span = qsbPercentageLabel.querySelector('span');
      const value = span ? span.textContent : '50%';
      qsbPercentageLabel.innerHTML = `${this.t('effects.stationsWithQSB')} (<span id="qsbValue">${value}</span>)`;
    }

    // US Only Callsigns
    const usOnlyLabel = document.getElementById('usOnlyLabel');
    if (usOnlyLabel) {
      const icon = usOnlyLabel.querySelector('i');
      const iconClass = icon ? icon.className : 'fa-solid fa-circle-check me-2';
      usOnlyLabel.innerHTML = `<i class="${iconClass}"></i>${this.t('respondingStation.usOnly')}`;
    }

    // Russian Only Callsigns
    const russianOnlyLabel = document.getElementById('russianOnlyLabel');
    if (russianOnlyLabel) {
      const icon = russianOnlyLabel.querySelector('i');
      const iconClass = icon ? icon.className : 'fa-solid fa-circle-check me-2';
      russianOnlyLabel.innerHTML = `<i class="${iconClass}"></i>${this.t('respondingStation.russianOnly')}`;
    }

    // Callsign Format Options
    const callsignFormatLabels = document.querySelectorAll('.form-label');
    callsignFormatLabels.forEach((label) => {
      if (
        label.textContent.includes('Callsign Format') ||
        label.textContent.includes('Формат позывных')
      ) {
        label.textContent = this.t('respondingStation.callsignFormat');
      }
    });

    // Enable Cut Numbers
    const cutNumbersLabel = document.getElementById('enableCutNumbersLabel');
    if (cutNumbersLabel) {
      const icon = cutNumbersLabel.querySelector('i');
      const iconClass = icon
        ? icon.className
        : 'fa-regular fa-circle-xmark me-2';
      cutNumbersLabel.innerHTML = `<i class="${iconClass}"></i>${this.t('respondingStation.enableCutNumbers')}`;
    }

    // Cut Number Options
    const cutNumberOptionsLabels = document.querySelectorAll('.form-label');
    cutNumberOptionsLabels.forEach((label) => {
      if (
        label.textContent.includes('Cut Number Options') ||
        label.textContent.includes('Опции сокращённых чисел')
      ) {
        label.textContent = this.t('respondingStation.cutNumberOptions');
      }
    });

    // Farnsworth button
    const farnsworthLabel = document.getElementById('enableFarnsworthLabel');
    if (farnsworthLabel) {
      const icon = farnsworthLabel.querySelector('i');
      const iconClass = icon
        ? icon.className
        : 'fa-regular fa-circle-xmark me-2';
      farnsworthLabel.innerHTML = `<i class="${iconClass}"></i>${this.t('respondingStation.farnsworth')}`;
    }

    // Кнопки
    const cqButton = document.getElementById('cqButton');
    if (cqButton) cqButton.textContent = this.t('buttons.cq');

    const sendButton = document.getElementById('sendButton');
    if (sendButton) sendButton.textContent = this.t('buttons.send');

    const tuButton = document.getElementById('tuButton');
    if (tuButton) tuButton.textContent = this.t('buttons.tu');

    const stopButton = document.getElementById('stopButton');
    if (stopButton) stopButton.textContent = this.t('buttons.stop');

    const resetButton = document.getElementById('resetButton');
    if (resetButton) resetButton.textContent = this.t('buttons.reset');

    // Placeholder для полей ввода
    const responseField = document.getElementById('responseField');
    if (responseField) responseField.placeholder = this.t('inputs.response');

    // Active Stations
    const activeStationsLabel = document.querySelector('strong');
    if (
      activeStationsLabel &&
      (activeStationsLabel.textContent.includes('Active Stations') ||
        activeStationsLabel.textContent.includes('Активных станций'))
    ) {
      activeStationsLabel.textContent = this.t('activeStations');
    }

    // Help Modal
    this.updateHelpModal();

    const betaText = document.querySelector('[data-i18n="betaWarning.text"]');
    if (betaText) betaText.innerHTML = this.t('betaWarning.text');

    const submitIssue = document.querySelector(
      '[data-i18n="betaWarning.submitIssue"]'
    );
    if (submitIssue)
      submitIssue.textContent = this.t('betaWarning.submitIssue');

    const forBugs = document.querySelector('[data-i18n="betaWarning.forBugs"]');
    if (forBugs) forBugs.textContent = this.t('betaWarning.forBugs');

    console.log('✨ UI updated successfully');
  }

  updateHelpModal() {
    // Заголовок Help Modal
    const helpTitle = document.getElementById('helpModalLabel');
    if (helpTitle) helpTitle.textContent = this.t('help.title');

    // Cheat section
    const cheatTitle = document.querySelector('#helpModal h5');
    if (cheatTitle && cheatTitle.textContent.includes('Cheat')) {
      cheatTitle.textContent = this.t('help.cheatTitle');
    }

    // Cheat text
    const cheatText = document.querySelector('#helpModal p');
    if (
      cheatText &&
      (cheatText.textContent.includes('JavaScript console') ||
        cheatText.textContent.includes('консоль JavaScript'))
    ) {
      cheatText.textContent = this.t('help.cheatText');
    }

    // Steps - используем более надёжный селектор
    const helpSteps = document.querySelectorAll('#helpModal h5');
    if (helpSteps.length >= 7) {
      helpSteps[1].textContent = this.t('help.step1Title');
      helpSteps[2].textContent = this.t('help.step2Title');
      helpSteps[3].textContent = this.t('help.step3Title');
      helpSteps[4].textContent = this.t('help.step4Title');
      helpSteps[5].textContent = this.t('help.step5Title');
      helpSteps[6].textContent = this.t('help.stopTitle');
      if (helpSteps[7]) helpSteps[7].textContent = this.t('help.resetTitle');
    }

    // Step texts
    const helpTexts = document.querySelectorAll('#helpModal p');
    if (helpTexts.length >= 8) {
      helpTexts[1].textContent = this.t('help.step1Text');
      helpTexts[2].textContent = this.t('help.step2Text');

      // Step 2 list
      const step2List = document.querySelectorAll('#helpModal ul li');
      if (step2List.length >= 4) {
        step2List[0].textContent = this.t('help.step2List.0');
        step2List[1].textContent = this.t('help.step2List.1');
        step2List[2].textContent = this.t('help.step2List.2');
        step2List[3].textContent = this.t('help.step2List.3');
      }

      helpTexts[3].textContent = this.t('help.step3Text');
      helpTexts[4].textContent = this.t('help.step4Text');
      helpTexts[5].textContent = this.t('help.step5Text');
      helpTexts[6].textContent = this.t('help.stopText');
      if (helpTexts[7]) helpTexts[7].textContent = this.t('help.resetText');
    }
  }

  /**
   * Перевод названия режима с сохранением иконки и бейджа NEW.
   * Обычный updateLabel затирает вложенные элементы через textContent.
   */
  updateModeLabelWithBadge(forId, translationKey) {
    const label = document.querySelector(`label[for="${forId}"]`);
    if (!label) return;

    const icon = label.querySelector('i');
    const badge = label.querySelector('.badge');

    label.textContent = '';
    if (icon) label.appendChild(icon);
    label.appendChild(document.createTextNode(` ${this.t(translationKey)} `));
    if (badge) label.appendChild(badge);
  }

  updateLabel(forId, translationKey) {
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) {
      label.textContent = this.t(translationKey);
    }
  }

  updateLabelByFor(forAttr, translationKey) {
    const label = document.querySelector(`label[for="${forAttr}"]`);
    if (label) {
      const badge = label.querySelector('.badge');
      const br = label.querySelector('br');

      label.textContent = this.t(translationKey);

      if (badge) {
        label.insertBefore(badge, label.firstChild);
        if (br) label.insertBefore(br, badge.nextSibling);
      }
    }
  }
}

export const i18n = new LocalizationManager();
