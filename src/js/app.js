// Import Bootstrap CSS
import 'bootswatch/dist/cerulean/bootstrap.min.css';

// Import custom styles
import '../css/style.css';

// Import Bootstrap JavaScript
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import Font Awesome
import '@fortawesome/fontawesome-free/js/all.min.js';

// 🏆 Import Scoring and Hotkeys
import { ScoringSystem } from './scoring.js';
import { HotkeyManager } from './hotkeys.js';

import {
  audioContext,
  createMorsePlayer,
  getAudioLock,
  updateAudioLock,
  isBackgroundStaticPlaying,
  createBackgroundStatic,
  stopAllAudio,
} from './audio.js';
import { clearAllInvalidStates, getInputs } from './inputs.js';
import {
  compareStrings,
  respondWithAllStations,
  addStations,
  addTableRow,
  clearTable,
  updateActiveStations,
  printStation,
} from './util.js';
import {
  getYourStation,
  getCallingStation,
  resetRDASerialNumber,
} from './stationGenerator.js';
import { updateStaticIntensity } from './audio.js';
import { modes } from './modes.js';
import { LAYOUTS } from './hotkeys.js';
import { i18n } from '../localization/index.js';

/**
 * Application state variables.
 */
let currentMode;
let scoringSystem; // 🏆 Добавлено
let hotkeyManager = null; // ⌨️ Менеджер горячих клавиш
let inputs = null;
let currentStations = [];
let currentStation = null;
let activeStationIndex = null;
let readyForTU = false;
let currentStationAttempts = 0;
let currentStationStartTime = null;
let totalContacts = 0;
let yourStation = null;
let lastRespondingStations = null;
const farnsworthLowerBy = 6;

/**
 * ⏎ Стадии QSO для ESM (Enter Sends Message).
 *
 * В контест-логгерах Enter — единственная клавиша, которой ведут связь:
 * что уйдёт в эфир, определяется тем, на какой стадии находится QSO.
 * Раньше состояние было размазано по флагам readyForTU / activeStationIndex —
 * теперь оно явное.
 *
 *   IDLE         — эфир пуст, ничего не передавали
 *   CQ_SENT      — дали общий вызов, идёт разбор отвечающих станций
 *   READY_FOR_TU — позывной и обмен приняты, осталось записать и закрыть QSO
 */
const QSO_STATE = {
  IDLE: 'IDLE',
  CQ_SENT: 'CQ_SENT',
  READY_FOR_TU: 'READY_FOR_TU',
};
let qsoState = QSO_STATE.IDLE;

/**
 * Event listener setup.
 */
document.addEventListener('DOMContentLoaded', () => {
  // 🏆 Initialize Scoring System
  scoringSystem = new ScoringSystem();

  // UI elements
  const cqButton = document.getElementById('cqButton');
  const responseField = document.getElementById('responseField');
  const infoField = document.getElementById('infoField');
  const infoField2 = document.getElementById('infoField2');
  const sendButton = document.getElementById('sendButton');
  const tuButton = document.getElementById('tuButton');
  const resetButton = document.getElementById('resetButton');
  const stopButton = document.getElementById('stopButton');
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const yourCallsign = document.getElementById('yourCallsign');
  const yourName = document.getElementById('yourName');
  const yourState = document.getElementById('yourState');
  const yourSpeed = document.getElementById('yourSpeed');
  const yourSidetone = document.getElementById('yourSidetone');
  const yourVolume = document.getElementById('yourVolume');

  // ⌨️ Initialize Hotkey Manager
  hotkeyManager = new HotkeyManager(
    {
      cqButton,
      sendButton,
      tuButton,
      stopButton,
      resetButton,
      responseField,
      infoField,
      infoField2,
    },
    {
      cq,
      tu,
      stop,
      wipe,
      sendMacro,
      adjustSpeed,
    }
  );

  // Переключатель раскладки Contest / Training
  const layoutToggle = document.getElementById('hotkeyLayoutToggle');
  const savedLayout = localStorage.getItem('hotkeyLayout') || 'contest';
  hotkeyManager.setLayout(savedLayout);
  if (layoutToggle) {
    layoutToggle.checked = savedLayout === 'training';
    layoutToggle.addEventListener('change', () => {
      const name = layoutToggle.checked ? 'training' : 'contest';
      hotkeyManager.setLayout(name);
      localStorage.setItem('hotkeyLayout', name);
      renderHotkeyBar();
    });
  }
  renderHotkeyBar();

  // Language switcher initialization
  i18n.setLanguage(i18n.currentLang);

  document.getElementById('lang-en').addEventListener('click', () => {
    i18n.setLanguage('en');
  });

  document.getElementById('lang-ru').addEventListener('click', () => {
    i18n.setLanguage('ru');
  });

  // Event Listeners
  cqButton.addEventListener('click', cq);
  sendButton.addEventListener('click', send);
  tuButton.addEventListener('click', tu);
  resetButton.addEventListener('click', reset);
  stopButton.addEventListener('click', stop);
  modeRadios.forEach((radio) => {
    radio.addEventListener('change', changeMode);
  });

  // QSB
  const qsbCheckbox = document.getElementById('qsb');
  const qsbPercentage = document.getElementById('qsbPercentage');
  qsbPercentage.disabled = !qsbCheckbox.checked;
  qsbCheckbox.addEventListener('change', () => {
    qsbPercentage.disabled = !qsbCheckbox.checked;
  });

  // Farnsworth
  const enableFarnsworthCheckbox = document.getElementById('enableFarnsworth');
  const farnsworthSpeedInput = document.getElementById('farnsworthSpeed');
  farnsworthSpeedInput.disabled = !enableFarnsworthCheckbox.checked;
  enableFarnsworthCheckbox.addEventListener('change', () => {
    farnsworthSpeedInput.disabled = !enableFarnsworthCheckbox.checked;
  });

  // Cut Numbers
  const enableCutNumbersCheckbox = document.getElementById('enableCutNumbers');
  const cutNumberIds = [
    'cutT',
    'cutA',
    'cutU',
    'cutV',
    'cutE',
    'cutG',
    'cutD',
    'cutN',
  ];
  cutNumberIds.forEach((id) => {
    const checkbox = document.getElementById(id);
    checkbox.disabled = !enableCutNumbersCheckbox.checked;
  });
  enableCutNumbersCheckbox.addEventListener('change', () => {
    cutNumberIds.forEach((id) => {
      const checkbox = document.getElementById(id);
      checkbox.disabled = !enableCutNumbersCheckbox.checked;
    });
  });

  // Responsive buttons
  function updateResponsiveButtons() {
    const responsiveButtons = document.querySelectorAll('.btn-responsive');
    responsiveButtons.forEach((button) => {
      if (window.innerWidth < 576) {
        button.classList.add('btn-sm');
      } else {
        button.classList.remove('btn-sm');
      }
    });
  }
  updateResponsiveButtons();
  window.addEventListener('resize', updateResponsiveButtons);

  // ⏎ ESM — Enter Sends Message.
  // Одна клавиша ведёт QSO целиком: что именно уйдёт в эфир, решает стадия.
  [responseField, infoField, infoField2].forEach((field) => {
    field.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      event.preventDefault();
      esmEnter();
    });
  });

  cqButton.addEventListener('click', () => {
    responseField.focus();
  });

  // Local Storage
  const keys = {
    yourCallsign: 'yourCallsign',
    yourName: 'yourName',
    yourState: 'yourState',
    yourSpeed: 'yourSpeed',
    yourSidetone: 'yourSidetone',
    yourVolume: 'yourVolume',
  };

  yourCallsign.value =
    localStorage.getItem(keys.yourCallsign) || yourCallsign.value;
  yourName.value = localStorage.getItem(keys.yourName) || yourName.value;
  yourState.value = localStorage.getItem(keys.yourState) || yourState.value;
  yourSpeed.value = localStorage.getItem(keys.yourSpeed) || yourSpeed.value;
  yourSidetone.value =
    localStorage.getItem(keys.yourSidetone) || yourSidetone.value;
  yourVolume.value = localStorage.getItem(keys.yourVolume) || yourVolume.value;

  yourCallsign.addEventListener('input', () => {
    localStorage.setItem(keys.yourCallsign, yourCallsign.value);
  });
  yourName.addEventListener('input', () => {
    localStorage.setItem(keys.yourName, yourName.value);
  });
  yourState.addEventListener('input', () => {
    localStorage.setItem(keys.yourState, yourState.value);
  });
  yourSpeed.addEventListener('input', () => {
    localStorage.setItem(keys.yourSpeed, yourSpeed.value);
  });
  yourSidetone.addEventListener('input', () => {
    localStorage.setItem(keys.yourSidetone, yourSidetone.value);
  });
  yourVolume.addEventListener('input', () => {
    localStorage.setItem(keys.yourVolume, yourVolume.value);
  });

  // Бейдж скорости в панели горячих клавиш держим в синхроне с полем
  const speedBadge = document.getElementById('speedBadge');
  const syncSpeedBadge = () => {
    if (speedBadge) speedBadge.textContent = `${yourSpeed.value} WPM`;
  };
  syncSpeedBadge();
  yourSpeed.addEventListener('input', syncSpeedBadge);

  // QRN intensity
  const qrnRadioButtons = document.querySelectorAll('input[name="qrn"]');
  qrnRadioButtons.forEach((radio) => {
    radio.addEventListener('change', updateStaticIntensity);
  });

  // Mode initialization
  const savedMode = localStorage.getItem('mode') || 'single';
  const modeExists = modes[savedMode] !== undefined;
  const modeToUse = modeExists ? savedMode : 'single';

  const savedModeRadio = document.querySelector(
    `input[name="mode"][value="${modeToUse}"]`
  );
  if (savedModeRadio) {
    savedModeRadio.checked = true;
  } else {
    const singleRadio = document.querySelector(
      `input[name="mode"][value="single"]`
    );
    if (singleRadio) {
      singleRadio.checked = true;
    }
  }

  currentMode = modeToUse;

  if (yourCallsign.value !== '' && window.location.hostname !== 'localhost') {
    fetch(`https://stats.${window.location.hostname}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: currentMode, callsign: yourCallsign.value }),
    }).catch((error) => {
      console.error('Failed to send CloudFlare stats.');
    });
  }

  resetGameState();
  applyModeSettings(currentMode);
});

/**
 * Language update function
 */
function updateLanguage(lang) {
  i18n.setLanguage(lang);
}

/**
 * Functions
 */
function getModeConfig() {
  const config = modes[currentMode]?.logic;
  if (!config) {
    console.error(
      `❌ Mode "${currentMode}" not found in modes. Using "single".`
    );
    return modes['single'].logic;
  }
  return config;
}

function applyModeSettings(mode) {
  // 🔍 Проверяем, существует ли режим
  if (!modes[mode]) {
    console.error(
      `❌ Mode "${mode}" not found in modes. Defaulting to "single".`
    );

    // Если уже пытаемся применить 'single' — останавливаем рекурсию
    if (mode === 'single') {
      console.error('❌ CRITICAL: "single" mode not found! Check modes.js');
      return;
    }

    currentMode = 'single';
    const singleRadio = document.querySelector(
      'input[name="mode"][value="single"]'
    );
    if (singleRadio) singleRadio.checked = true;

    // Рекурсивно применяем 'single'
    applyModeSettings('single');
    return;
  }

  const config = modes[mode].ui;

  // 🆕 Если режим RDA — включить Russian Only
  if (mode === 'rda') {
    const russianOnlyCheckbox = document.getElementById('russianOnly');
    if (russianOnlyCheckbox && !russianOnlyCheckbox.checked) {
      russianOnlyCheckbox.checked = true;
      console.log('✅ Russian Only enabled for RDA mode');
    }
  }

  const tuButton = document.getElementById('tuButton');
  const infoField = document.getElementById('infoField');
  const infoField2 = document.getElementById('infoField2');
  const resultsTable = document.getElementById('resultsTable');
  const modeResultsHeader = document.getElementById('modeResultsHeader');

  tuButton.style.display = config.showTuButton ? 'inline-block' : 'none';

  if (config.showInfoField) {
    infoField.style.display = 'inline-block';
    infoField.placeholder = config.infoFieldPlaceholder;
  } else {
    infoField.style.display = 'none';
    infoField.value = '';
  }

  if (config.showInfoField2) {
    infoField2.style.display = 'inline-block';
    infoField2.placeholder = config.infoField2Placeholder;
  } else {
    infoField2.style.display = 'none';
    infoField2.value = '';
  }

  modeResultsHeader.textContent = config.resultsHeader;

  const extraColumns = resultsTable.querySelectorAll('.mode-specific-column');
  extraColumns.forEach((col) => {
    col.style.display = config.tableExtraColumn ? 'table-cell' : 'none';
  });

  const extraColumnHeaders = resultsTable.querySelectorAll(
    'thead .mode-specific-column'
  );
  extraColumnHeaders.forEach((header) => {
    header.textContent = config.extraColumnHeader || 'Additional Info';
  });
}

function resetGameState() {
  currentStations = [];
  currentStation = null;
  activeStationIndex = null;
  readyForTU = false;
  currentStationAttempts = 0;
  currentStationStartTime = null;
  totalContacts = 0;
  setQsoState(QSO_STATE.IDLE);

  // 🏆 Reset Scoring
  scoringSystem = new ScoringSystem();
  updateScoreboard();

  updateActiveStations(0);
  clearTable('resultsTable');
  document.getElementById('responseField').value = '';
  document.getElementById('infoField').value = '';
  document.getElementById('infoField2').value = '';
  document.getElementById('cqButton').disabled = false;
  stopAllAudio();
  updateAudioLock(0);
}

function changeMode() {
  const selectedMode = document.querySelector(
    'input[name="mode"]:checked'
  ).value;
  currentMode = selectedMode;
  localStorage.setItem('mode', currentMode);
  resetGameState();
  clearAllInvalidStates();
  applyModeSettings(currentMode);
}

function cq() {
  if (getAudioLock()) return;

  const modeConfig = getModeConfig();
  const cqButton = document.getElementById('cqButton');

  if (!modeConfig.showTuStep && currentStation !== null) {
    return;
  }

  let backgroundStaticDelay = 0;
  if (!isBackgroundStaticPlaying()) {
    createBackgroundStatic();
    backgroundStaticDelay = 2;
  }

  inputs = getInputs();
  if (inputs === null) return;

  yourStation = getYourStation();
  yourStation.player = createMorsePlayer(yourStation);

  let cqMsg = modeConfig.cqMessage(yourStation, null, null);
  let yourResponseTimer = yourStation.player.playSentence(
    cqMsg,
    audioContext.currentTime + backgroundStaticDelay
  );
  updateAudioLock(yourResponseTimer);

  if (modeConfig.showTuStep) {
    addStations(currentStations, inputs);
    respondWithAllStations(currentStations, yourResponseTimer);
    lastRespondingStations = currentStations;
  } else {
    cqButton.disabled = true;
    nextSingleStation(yourResponseTimer);
  }

  setQsoState(QSO_STATE.CQ_SENT);
}

function send() {
  if (getAudioLock()) return;
  const modeConfig = getModeConfig();
  const responseField = document.getElementById('responseField');
  const infoField = document.getElementById('infoField');
  const infoField2 = document.getElementById('infoField2');

  let responseFieldText = responseField.value.trim().toUpperCase();

  if (responseFieldText === '') {
    if (currentStations.length === 0) {
      cq();
    }
    return;
  }

  console.log(`--> Sending "${responseFieldText}"`);

  if (modeConfig.showTuStep) {
    if (currentStations.length === 0) return;

    let yourResponseTimer = yourStation.player.playSentence(responseFieldText);
    updateAudioLock(yourResponseTimer);

    if (
      responseFieldText === '?' ||
      responseFieldText === 'AGN' ||
      responseFieldText === 'AGN?'
    ) {
      respondWithAllStations(currentStations, yourResponseTimer);
      lastRespondingStations = currentStations;
      currentStationAttempts++;
      return;
    }

    if (responseFieldText === 'QRS') {
      lastRespondingStations.forEach((stn) => {
        if (stn.enableFarnsworth) {
          stn.farnsworthSpeed = Math.max(
            5,
            stn.farnsworthSpeed - farnsworthLowerBy
          );
        } else {
          stn.enableFarnsworth = true;
          stn.farnsworthSpeed = stn.wpm - farnsworthLowerBy;
        }
      });
      respondWithAllStations(lastRespondingStations, yourResponseTimer);
      currentStationAttempts++;
      return;
    }

    let results = currentStations.map((stn) =>
      compareStrings(stn.callsign, responseFieldText.replace('?', ''))
    );
    let hasQuestionMark = responseFieldText.includes('?');

    if (results.includes('perfect')) {
      let matchIndex = results.indexOf('perfect');
      if (hasQuestionMark) {
        let theirResponseTimer = currentStations[
          matchIndex
        ].player.playSentence('RR', yourResponseTimer + 0.25);
        updateAudioLock(theirResponseTimer);
        currentStationAttempts++;
        return;
      } else {
        let yourExchange =
          ' ' +
          modeConfig.yourExchange(
            yourStation,
            currentStations[matchIndex],
            null
          );
        let theirExchange = modeConfig.theirExchange(
          yourStation,
          currentStations[matchIndex],
          null
        );

        if (inputs.enableCutNumbers) {
          const cutMap = inputs.cutNumbers;
          yourExchange = yourExchange.replace(
            /\d/g,
            (digit) => cutMap[digit] || digit
          );
          theirExchange = theirExchange.replace(
            /\d/g,
            (digit) => cutMap[digit] || digit
          );
        }

        let yourResponseTimer2 = yourStation.player.playSentence(
          yourExchange,
          yourResponseTimer
        );
        updateAudioLock(yourResponseTimer2);
        let theirResponseTimer = currentStations[
          matchIndex
        ].player.playSentence(theirExchange, yourResponseTimer2 + 0.5);
        updateAudioLock(theirResponseTimer);
        currentStationAttempts++;

        if (modeConfig.requiresInfoField) {
          infoField.focus();
        }
        readyForTU = true;
        activeStationIndex = matchIndex;
        setQsoState(QSO_STATE.READY_FOR_TU);
        return;
      }
    }

    if (results.includes('partial')) {
      let partialMatchStations = currentStations.filter(
        (_, index) => results[index] === 'partial'
      );
      respondWithAllStations(partialMatchStations, yourResponseTimer);
      lastRespondingStations = partialMatchStations;
      currentStationAttempts++;
      return;
    }

    currentStationAttempts++;
  } else {
    if (currentStation === null) return;

    let yourResponseTimer = yourStation.player.playSentence(responseFieldText);
    updateAudioLock(yourResponseTimer);

    if (
      responseFieldText === '?' ||
      responseFieldText === 'AGN' ||
      responseFieldText === 'AGN?'
    ) {
      let theirResponseTimer = currentStation.player.playSentence(
        currentStation.callsign,
        yourResponseTimer + Math.random() + 0.25
      );
      updateAudioLock(theirResponseTimer);
      currentStationAttempts++;
      return;
    }

    if (responseFieldText === 'QRS') {
      if (currentStation.enableFarnsworth) {
        currentStation.farnsworthSpeed = Math.max(
          5,
          currentStation.farnsworthSpeed - farnsworthLowerBy
        );
      } else {
        currentStation.enableFarnsworth = true;
        currentStation.farnsworthSpeed = currentStation.wpm - farnsworthLowerBy;
      }
      currentStation.player = createMorsePlayer(currentStation);
      let theirResponseTimer = currentStation.player.playSentence(
        currentStation.callsign,
        yourResponseTimer + Math.random() + 0.25
      );
      updateAudioLock(theirResponseTimer);
      currentStationAttempts++;
      return;
    }

    let compareResult = compareStrings(
      currentStation.callsign,
      responseFieldText.replace('?', '')
    );

    if (compareResult === 'perfect') {
      currentStationAttempts++;

      if (responseFieldText.includes('?')) {
        let theirResponseTimer = currentStation.player.playSentence(
          'RR',
          yourResponseTimer + 1
        );
        updateAudioLock(theirResponseTimer);
        return;
      }

      let yourExchange =
        ' ' + modeConfig.yourExchange(yourStation, currentStation, null);
      let theirExchange = modeConfig.theirExchange(
        yourStation,
        currentStation,
        null
      );

      let yourResponseTimer2 = yourStation.player.playSentence(
        yourExchange,
        yourResponseTimer
      );
      updateAudioLock(yourResponseTimer2);
      let theirResponseTimer = currentStation.player.playSentence(
        theirExchange,
        yourResponseTimer2 + 0.5
      );
      updateAudioLock(theirResponseTimer);
      let yourSignoff = modeConfig.yourSignoff(
        yourStation,
        currentStation,
        null
      );
      let yourResponseTimer3 = yourStation.player.playSentence(
        yourSignoff,
        theirResponseTimer + 0.5
      );
      updateAudioLock(yourResponseTimer3);
      let theirSignoff = modeConfig.theirSignoff(
        yourStation,
        currentStation,
        null
      );
      let theirResponseTimer2 = currentStation.player.playSentence(
        theirSignoff,
        yourResponseTimer3 + 0.5
      );
      updateAudioLock(theirResponseTimer2);

      totalContacts++;
      const wpmString =
        `${currentStation.wpm}` +
        (currentStation.enableFarnsworth
          ? ` / ${currentStation.farnsworthSpeed}`
          : '');

      // 🏆 В одиночных режимах TU-шага нет, поэтому связь засчитываем здесь.
      // Раньше очки в single/hst не начислялись вообще.
      let singleResult = { status: 'ok' };
      try {
        singleResult = scoringSystem.addQSO(currentMode, {
          callsign: currentStation.callsign,
          region: currentStation.rdaRegion || currentStation.state,
          state: currentStation.state,
        });
        updateScoreboard();
      } catch (error) {
        console.error('❌ Ошибка при добавлении QSO:', error);
      }

      addTableRow(
        'resultsTable',
        totalContacts,
        currentStation.callsign,
        wpmString,
        currentStationAttempts,
        audioContext.currentTime - currentStationStartTime,
        singleResult.status === 'dupe'
          ? '<span class="badge bg-warning text-dark">DUPE</span>'
          : '',
        singleResult.status
      );

      nextSingleStation(theirResponseTimer2);
      return;
    } else if (compareResult === 'partial') {
      currentStationAttempts++;
      let theirResponseTimer = currentStation.player.playSentence(
        currentStation.callsign,
        yourResponseTimer + Math.random() + 0.25
      );
      updateAudioLock(theirResponseTimer);
      return;
    }

    currentStationAttempts++;
    let theirResponseTimer = currentStation.player.playSentence(
      currentStation.callsign,
      yourResponseTimer + Math.random() + 0.25
    );
    updateAudioLock(theirResponseTimer);
  }
}

function tu() {
  if (getAudioLock()) return;
  const modeConfig = getModeConfig();
  if (!modeConfig.showTuStep || !readyForTU) return;

  const infoField = document.getElementById('infoField');
  const infoField2 = document.getElementById('infoField2');
  let infoValue1 = infoField.value.trim();
  let infoValue2 = infoField2.value.trim();

  let currentStation = currentStations[activeStationIndex];
  totalContacts++;

  let extraInfo = '';
  let copiedCorrectly = true;

  const check1 = compareExtraInfo(
    modeConfig.extraInfoFieldKey,
    infoValue1,
    currentStation
  );
  extraInfo += check1.html;
  copiedCorrectly = copiedCorrectly && check1.correct;

  if (modeConfig.requiresInfoField2 && modeConfig.extraInfoFieldKey2) {
    if (extraInfo.length > 0) extraInfo += ' / ';
    const check2 = compareExtraInfo(
      modeConfig.extraInfoFieldKey2,
      infoValue2,
      currentStation
    );
    extraInfo += check2.html;
    copiedCorrectly = copiedCorrectly && check2.correct;
  }

  let arbitrary = null;
  if (currentMode === 'sst') {
    arbitrary = infoValue1;
  } else if (currentMode === 'pota' || currentMode === 'rda') {
    arbitrary = infoValue1;
  }

  let yourSignoffMessage = modeConfig.yourSignoff(
    yourStation,
    currentStation,
    arbitrary
  );

  let yourResponseTimer = yourStation.player.playSentence(
    yourSignoffMessage,
    audioContext.currentTime + 0.5
  );
  updateAudioLock(yourResponseTimer);

  let responseTimerToUse = yourResponseTimer;

  if (typeof modeConfig.theirSignoff === 'function') {
    let theirSignoffMessage = modeConfig.theirSignoff(
      yourStation,
      currentStation,
      null
    );
    if (theirSignoffMessage) {
      let theirResponseTimer = currentStation.player.playSentence(
        theirSignoffMessage,
        yourResponseTimer + 0.5
      );
      updateAudioLock(theirResponseTimer);
      responseTimerToUse = theirResponseTimer;
    }
  }

  const wpmString =
    `${currentStation.wpm}` +
    (currentStation.enableFarnsworth
      ? ` / ${currentStation.farnsworthSpeed}`
      : '');

  // 🆕 Для RDA показываем регион, для остальных — extraInfo
  let displayInfo = extraInfo;
  if (currentMode === 'rda' && currentStation.rdaRegion) {
    displayInfo = `🇷🇺 ${currentStation.rdaRegion}`;
  }

  // 🏆 Сначала считаем, потом пишем строку: результат подсчёта решает,
  // как эту строку пометить (дубль / ошибка приёма / засчитано)
  const qso = {
    callsign: currentStation.callsign,
    // 🇷🇺 Для RDA используем rdaRegion (TL-27), для CWT — state (CA, TX)
    region: currentStation.rdaRegion || currentStation.state,
    state: currentStation.state,
    hasError: !copiedCorrectly,
  };

  let result = { status: 'ok', points: 0 };
  try {
    result = scoringSystem.addQSO(currentMode, qso);
    updateScoreboard();
  } catch (error) {
    console.error('❌ Ошибка при добавлении QSO:', error);
    // Программа продолжит работу, даже если scoring сломается
  }

  // Помечаем строку прямо в логе, чтобы счётчик связей и таблица сходились
  if (result.status === 'dupe') {
    displayInfo = `<span class="badge bg-warning text-dark me-1">DUPE</span>${displayInfo}`;
  } else if (result.status === 'error') {
    displayInfo = `<span class="badge bg-danger me-1">${i18n.t('scoreboard.notCounted')}</span>${displayInfo}`;
  }

  addTableRow(
    'resultsTable',
    totalContacts,
    currentStation.callsign,
    wpmString,
    currentStationAttempts,
    audioContext.currentTime - currentStationStartTime,
    displayInfo,
    result.status
  );

  currentStations.splice(activeStationIndex, 1);
  activeStationIndex = null;
  currentStationAttempts = 0;
  readyForTU = false;
  setQsoState(QSO_STATE.CQ_SENT);
  updateActiveStations(currentStations.length);

  const responseField = document.getElementById('responseField');
  responseField.value = '';
  infoField.value = '';
  infoField2.value = '';
  responseField.focus();

  if (Math.random() < 0.4) {
    addStations(currentStations, inputs);
  }

  respondWithAllStations(currentStations, responseTimerToUse);
  lastRespondingStations = currentStations;
  currentStationStartTime = audioContext.currentTime;
}

/**
 * Сверка принятого обмена с тем, что реально передала станция.
 *
 * Возвращает и разметку для таблицы, и факт ошибки: раньше результат сверки
 * только красил ячейку, а до системы подсчёта не доходил — из-за этого
 * «Точность» всегда показывала 100%.
 *
 * @returns {{ html: string, correct: boolean }}
 */
function compareExtraInfo(fieldKey, userInput, callingStation) {
  if (!fieldKey) return { html: '', correct: true };

  let expectedValue = callingStation[fieldKey];

  if (fieldKey === 'serialNumber' || fieldKey === 'cwopsNumber') {
    let userValInt = parseInt(userInput, 10);

    if (isNaN(userValInt)) {
      return {
        html: `<span class="text-warning">
                <i class="fa-solid fa-triangle-exclamation me-1"></i>
              </span> (${expectedValue})`,
        correct: false,
      };
    }

    let correct = userValInt === Number(expectedValue);
    return {
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

  let upperExpectedValue = String(expectedValue).toUpperCase();
  userInput = (userInput || '').toUpperCase().trim();

  // Станция без этого поля (например, DX без области) — сверять нечего
  if (upperExpectedValue === '' || upperExpectedValue === 'UNDEFINED') {
    return { html: 'N/A', correct: true };
  }

  let correct = userInput === upperExpectedValue;
  return {
    html: correct
      ? `<span class="text-success">
         <i class="fa-solid fa-check me-1"></i><strong>${userInput}</strong>
       </span>`
      : `<span class="text-warning">
         <i class="fa-solid fa-triangle-exclamation me-1"></i>${userInput}
       </span> (${upperExpectedValue})`,
    correct,
  };
}

function nextSingleStation(responseStartTime) {
  const modeConfig = getModeConfig();
  const responseField = document.getElementById('responseField');
  const cqButton = document.getElementById('cqButton');

  let callingStation = getCallingStation();
  printStation(callingStation);
  currentStation = callingStation;
  currentStationAttempts = 0;
  updateActiveStations(1);

  callingStation.player = createMorsePlayer(callingStation);
  let theirResponseTimer = callingStation.player.playSentence(
    callingStation.callsign,
    responseStartTime + Math.random() + 1
  );
  updateAudioLock(theirResponseTimer);

  currentStationStartTime = theirResponseTimer;
  responseField.value = '';
  responseField.focus();

  cqButton.disabled = !modeConfig.showTuStep && currentStation !== null;
}

function stop() {
  stopAllAudio();
  const cqButton = document.getElementById('cqButton');
  cqButton.disabled = false;

  if (currentMode === 'single') {
    currentStation = null;
    currentStationAttempts = 0;
    currentStationStartTime = null;
    updateActiveStations(0);
    setQsoState(QSO_STATE.IDLE);
  }
}

/**
 * ⏎ ESM — Enter Sends Message.
 *
 * Enter отправляет то, что уместно на текущей стадии QSO:
 *   поле позывного пустое   → CQ
 *   позывной введён         → его позывной + твой обмен
 *   их обмен принят         → TU и переход к следующей связи
 *
 * Именно так работают N1MM, DXLog и Morse Runner. Привычка нажимать
 * один Enter вместо трёх разных кнопок переносится в живой эфир как есть.
 */
function esmEnter() {
  if (getAudioLock()) return;

  const modeConfig = getModeConfig();
  const responseField = document.getElementById('responseField');
  const hasCall = responseField.value.trim() !== '';

  // Одиночные режимы (single / hst): TU-шага нет, цикл закрывается сам
  if (!modeConfig.showTuStep) {
    if (!hasCall && currentStation === null) {
      cq();
    } else {
      send();
    }
    return;
  }

  switch (qsoState) {
    // Их обмен уже принят — Enter закрывает связь
    case QSO_STATE.READY_FOR_TU:
      tu();
      return;

    // Эфир пуст либо идёт разбор пайлапа
    case QSO_STATE.IDLE:
    case QSO_STATE.CQ_SENT:
    default:
      if (!hasCall) {
        if (currentStations.length === 0) cq();
        return;
      }
      send();
  }
}

/** Перевод QSO в новую стадию + обновление подсказки «что дальше» */
function setQsoState(next) {
  if (qsoState === next) return;
  qsoState = next;
  console.log(`⏎ Стадия QSO: ${next}`);
  renderQsoHint();
}

/**
 * Подсказка под панелью клавиш: что Enter сделает прямо сейчас.
 * Новичку это заменяет чтение мануала — он видит следующий шаг на экране.
 */
function renderQsoHint() {
  const hint = document.getElementById('qsoHint');
  if (!hint) return;

  const key = `esm.${qsoState}`;
  hint.textContent = i18n.t(key);
  hint.setAttribute('data-i18n', key);
}

/**
 * ⌨️ Макросы функциональных клавиш.
 *
 * Собираются из тех же кубиков, что и обычный ход QSO:
 *   F2  myExchange      — только твой обмен, без позывного корреспондента
 *   F4  myCall          — твой позывной
 *   F5  hisCall         — позывной из поля ввода
 *   INS hisCallExchange — позывной + обмен одной посылкой (F5 + F2)
 *   F7  question        — «?»
 *   F8  agn             — «AGN»
 *   F3  qrs             — «QRS» (только обучающая раскладка)
 */
function sendMacro(name) {
  if (getAudioLock()) return;

  const modeConfig = getModeConfig();
  const responseField = document.getElementById('responseField');
  const typedCall = responseField.value.trim().toUpperCase();

  // Станция, с которой сейчас ведётся QSO (если есть)
  const target =
    activeStationIndex !== null
      ? currentStations[activeStationIndex]
      : currentStation;

  // Позывной корреспондента: приоритет — то, что набрано в поле
  const theirCall = typedCall || target?.callsign || '';
  const theirStub = target || { callsign: theirCall };

  let message = '';

  switch (name) {
    case 'myCall':
      message = ensureYourStation()?.callsign || '';
      break;

    case 'hisCall':
      message = theirCall;
      break;

    case 'myExchange':
      message = buildMyExchange(modeConfig, theirStub);
      break;

    case 'hisCallExchange':
      if (!theirCall) return;
      message = `${theirCall} ${buildMyExchange(modeConfig, theirStub)}`;
      break;

    case 'question':
      message = '?';
      break;

    case 'agn':
      message = 'AGN';
      break;

    case 'qrs':
      message = 'QRS';
      break;

    default:
      console.warn(`⚠️ Неизвестный макрос: ${name}`);
      return;
  }

  if (!message.trim()) return;

  // AGN / ? / QRS проходят через обычный send(): у них есть игровая реакция
  if (name === 'question' || name === 'agn' || name === 'qrs') {
    const saved = responseField.value;
    responseField.value = message;
    send();
    responseField.value = saved;
    return;
  }

  playFromYourStation(message);
}

/** Твой обмен без позывного корреспондента (для F2 и Insert) */
function buildMyExchange(modeConfig, theirStation) {
  const you = ensureYourStation();
  if (!you) return '';
  const fn = modeConfig.myExchange || modeConfig.yourExchange;
  let text = fn(you, theirStation, null);

  if (inputs?.enableCutNumbers) {
    const cutMap = inputs.cutNumbers;
    text = text.replace(/\d/g, (digit) => cutMap[digit] || digit);
  }
  return text;
}

/** Гарантирует, что твоя станция и её плеер созданы (макросы работают и до CQ) */
function ensureYourStation() {
  if (yourStation && yourStation.player) return yourStation;
  if (inputs === null) inputs = getInputs();
  if (inputs === null) return null;
  yourStation = getYourStation();
  if (!yourStation) return null;
  yourStation.player = createMorsePlayer(yourStation);
  return yourStation;
}

function playFromYourStation(message) {
  const you = ensureYourStation();
  if (!you) return;
  if (!isBackgroundStaticPlaying()) createBackgroundStatic();
  const timer = you.player.playSentence(
    message,
    audioContext.currentTime + 0.2
  );
  updateAudioLock(timer);
  console.log(`--> Макрос: "${message}"`);
}

/** ⌨️ Изменение скорости с клавиатуры (+/-) */
function adjustSpeed(delta) {
  const yourSpeed = document.getElementById('yourSpeed');
  const min = parseInt(yourSpeed.min, 10) || 5;
  const max = parseInt(yourSpeed.max, 10) || 60;
  const next = Math.min(
    max,
    Math.max(min, parseInt(yourSpeed.value, 10) + delta)
  );
  yourSpeed.value = next;
  localStorage.setItem('yourSpeed', next);
  yourSpeed.dispatchEvent(new Event('input', { bubbles: true }));

  // Пересоздаём плеер, чтобы новая скорость применилась сразу
  if (yourStation) {
    yourStation.wpm = next;
    yourStation.player = createMorsePlayer(yourStation);
  }
  if (inputs) inputs.yourSpeed = next;

  const badge = document.getElementById('speedBadge');
  if (badge) {
    badge.textContent = `${next} WPM`;
    badge.classList.add('speed-badge-flash');
    setTimeout(() => badge.classList.remove('speed-badge-flash'), 300);
  }
}

/** ⌨️ F12 — очистить поля ввода, не трогая лог и счёт (в логгерах это «wipe») */
function wipe() {
  const responseField = document.getElementById('responseField');
  document.getElementById('infoField').value = '';
  document.getElementById('infoField2').value = '';
  responseField.value = '';
  responseField.focus();
}

/**
 * ⌨️ Отрисовка панели-подсказки с горячими клавишами.
 * Новичок не должен угадывать раскладку — она всегда на экране.
 */
function renderHotkeyBar() {
  const bar = document.getElementById('hotkeyBar');
  if (!bar || !hotkeyManager) return;

  const layout = LAYOUTS[hotkeyManager.getLayout()];

  bar.innerHTML = layout.keys
    .map((k) => {
      const label = `<span class="hotkey-chip-label" data-i18n="${k.labelKey}">${i18n.t(k.labelKey)}</span>`;
      const kbd = `<kbd>${k.key}</kbd>`;

      // Клавиши с действием — кликабельны. На телефоне F-клавиш нет,
      // поэтому те же макросы доступны нажатием пальцем.
      if (k.action) {
        return `<button type="button" class="hotkey-chip" data-action="${k.action}">${kbd}${label}</button>`;
      }
      return `<span class="hotkey-chip hotkey-chip-static">${kbd}${label}</span>`;
    })
    .join('');

  bar.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      hotkeyManager.run(btn.dataset.action);
      document.getElementById('responseField').focus();
    });
  });
}

function reset() {
  clearTable('resultsTable');

  totalContacts = 0;
  currentStation = null;
  currentStationAttempts = 0;
  currentStationStartTime = null;
  currentStations = [];
  activeStationIndex = null;
  readyForTU = false;
  setQsoState(QSO_STATE.IDLE);

  // Reset RDA serial number for non-Russian stations
  resetRDASerialNumber();

  // 🏆 Reset Scoring
  scoringSystem = new ScoringSystem();
  updateScoreboard();

  updateActiveStations(0);
  updateAudioLock(0);
  stopAllAudio();

  const responseField = document.getElementById('responseField');
  const infoField = document.getElementById('infoField');
  const infoField2 = document.getElementById('infoField2');
  responseField.value = '';
  infoField.value = '';
  infoField2.value = '';
  responseField.focus();

  const modeConfig = getModeConfig();
  const cqButton = document.getElementById('cqButton');
  cqButton.disabled = false;
}

/**
 * 📊 Update scoreboard display
 */
function updateScoreboard() {
  // 🛡️ Проверка: инициализирована ли система подсчёта?
  if (!scoringSystem) {
    console.warn('⚠️ scoringSystem ещё не создана');
    return;
  }

  const finalScore = scoringSystem.getFinalScore(currentMode);

  // 🐛 DEBUG: Показываем счёт в консоли
  console.log('📊 Обновление Scoreboard:', finalScore);

  // 🛡️ Получаем все элементы с проверкой на существование
  const elements = {
    scoreQsos: document.getElementById('scoreQsos'),
    scorePoints: document.getElementById('scorePoints'),
    scoreMultipliers: document.getElementById('scoreMultipliers'),
    scoreTotalScore: document.getElementById('scoreTotalScore'),
    scoreAccuracy: document.getElementById('scoreAccuracy'),
    scoreMistakes: document.getElementById('scoreMistakes'),
    scoreDupes: document.getElementById('scoreDupes'),
  };

  // ✅ Обновляем только если элемент существует
  if (elements.scoreQsos) elements.scoreQsos.textContent = finalScore.qsos;
  if (elements.scorePoints)
    elements.scorePoints.textContent = finalScore.points;
  // В режимах без множителей честно пишем прочерк, а не бесполезный ×1
  if (elements.scoreMultipliers) {
    elements.scoreMultipliers.textContent = finalScore.usesMultipliers
      ? finalScore.multipliers
      : '—';
  }
  if (elements.scoreTotalScore)
    elements.scoreTotalScore.textContent = finalScore.totalScore;

  if (elements.scoreAccuracy)
    elements.scoreAccuracy.textContent = finalScore.accuracy + '%';
  if (elements.scoreMistakes)
    elements.scoreMistakes.textContent = finalScore.mistakes;
  if (elements.scoreDupes) elements.scoreDupes.textContent = finalScore.dupes;
}
