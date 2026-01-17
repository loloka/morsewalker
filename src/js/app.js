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
import { i18n } from '../localization/index.js';

/**
 * Application state variables.
 */
let currentMode;
let scoringSystem; // 🏆 Добавлено
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
  const hotkeyManager = new HotkeyManager({
    cqButton,
    sendButton,
    tuButton,
    stopButton,
    resetButton,
    responseField,
  });

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

  // Enter key handlers
  responseField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendButton.click();
    }
  });

  infoField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && tuButton.style.display !== 'none') {
      event.preventDefault();
      tuButton.click();
    }
  });

  infoField2.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && tuButton.style.display !== 'none') {
      event.preventDefault();
      tuButton.click();
    }
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

function resetGameState() {
  currentStations = [];
  currentStation = null;
  activeStationIndex = null;
  readyForTU = false;
  currentStationAttempts = 0;
  currentStationStartTime = null;
  totalContacts = 0;

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
      addTableRow(
        'resultsTable',
        totalContacts,
        currentStation.callsign,
        wpmString,
        currentStationAttempts,
        audioContext.currentTime - currentStationStartTime,
        ''
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
  extraInfo += compareExtraInfo(
    modeConfig.extraInfoFieldKey,
    infoValue1,
    currentStation
  );
  if (modeConfig.requiresInfoField2 && modeConfig.extraInfoFieldKey2) {
    if (extraInfo.length > 0) extraInfo += ' / ';
    extraInfo += compareExtraInfo(
      modeConfig.extraInfoFieldKey2,
      infoValue2,
      currentStation
    );
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

  addTableRow(
    'resultsTable',
    totalContacts,
    currentStation.callsign,
    wpmString,
    currentStationAttempts,
    audioContext.currentTime - currentStationStartTime,
    displayInfo  // ✅ Теперь показывает TL-27 вместо (UNDEFINED)
  );


  // 🏆 Calculate Score with validation
  const qso = {
  callsign: currentStation.callsign,
  // 🇷🇺 Для RDA используем rdaRegion (TL-27), для CWT — state (CA, TX)
  region: currentStation.rdaRegion || currentStation.state,
  state: currentStation.state,
};

  // 🐛 DEBUG: Показываем, что отправляем
  console.log('📤 Отправка в scoringSystem:', {
    mode: currentMode,
    qso: qso
  });

  // ✅ Защита от ошибок
  try {
    scoringSystem.addQSO(currentMode, qso);
    updateScoreboard();
  } catch (error) {
    console.error('❌ Ошибка при добавлении QSO:', error);
    // Программа продолжит работу, даже если scoring сломается
  }

  currentStations.splice(activeStationIndex, 1);
  activeStationIndex = null;
  currentStationAttempts = 0;
  readyForTU = false;
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

function compareExtraInfo(fieldKey, userInput, callingStation) {
  if (!fieldKey) return '';

  let expectedValue = callingStation[fieldKey];

  if (fieldKey === 'serialNumber' || fieldKey === 'cwopsNumber') {
    let userValInt = parseInt(userInput, 10);

    if (isNaN(userValInt)) {
      return `<span class="text-warning">
                <i class="fa-solid fa-triangle-exclamation me-1"></i>
              </span> (${expectedValue})`;
    }

    let correct = userValInt === Number(expectedValue);
    return correct
      ? `<span class="text-success">
           <i class="fa-solid fa-check me-1"></i><strong>${userValInt}</strong>
         </span>`
      : `<span class="text-warning">
           <i class="fa-solid fa-triangle-exclamation me-1"></i>${userValInt}
         </span> (${expectedValue})`;
  }

  let upperExpectedValue = String(expectedValue).toUpperCase();
  userInput = (userInput || '').toUpperCase().trim();

  if (upperExpectedValue === '') {
    return 'N/A';
  }

  let correct = userInput === upperExpectedValue;
  return correct
    ? `<span class="text-success">
         <i class="fa-solid fa-check me-1"></i><strong>${userInput}</strong>
       </span>`
    : `<span class="text-warning">
         <i class="fa-solid fa-triangle-exclamation me-1"></i>${userInput}
       </span> (${upperExpectedValue})`;
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
  }
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
/**
 * 📊 Update scoreboard display
 */
function updateScoreboard() {
  // 🛡️ Проверка: инициализирована ли система подсчёта?
  if (!scoringSystem) {
    console.warn('⚠️ scoringSystem ещё не создана');
    return;
  }

  const finalScore = scoringSystem.getFinalScore();

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
  if (elements.scorePoints) elements.scorePoints.textContent = finalScore.points;
  if (elements.scoreMultipliers) elements.scoreMultipliers.textContent = finalScore.multipliers;
  if (elements.scoreTotalScore) elements.scoreTotalScore.textContent = finalScore.totalScore;

  // Рассчитываем точность
  const accuracy =
    finalScore.qsos > 0
      ? Math.round(((finalScore.qsos - finalScore.mistakes) / finalScore.qsos) * 100)
      : 100;

  if (elements.scoreAccuracy) elements.scoreAccuracy.textContent = accuracy + '%';
  if (elements.scoreMistakes) elements.scoreMistakes.textContent = finalScore.mistakes;
  if (elements.scoreDupes) elements.scoreDupes.textContent = finalScore.dupes;
} 