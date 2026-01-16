// js/localization-init.js

const translations = {
  en: {
    title: "Morse Walker",
    subtitle: "Walk before you run!",
    modes: {
      singleCaller: "Single Caller",
      basicContest: "Basic Contest",
      potaActivator: "POTA Activator",
      cwt: "CWT",
      k1usnSST: "K1USN SST"
    },
    yourStation: {
      title: "Your Station Settings",
      callsign: "Callsign",
      firstName: "First Name",
      state: "State",
      speed: "Speed (WPM)",
      sidetone: "Sidetone (Hz)",
      sidetoneVolume: "Sidetone Volume"
    },
    respondingStation: {
      title: "Responding Station Settings"
    },
    effects: {
      title: "Effects Settings"
    },
    buttons: {
      cq: "CQ",
      send: "Send",
      tu: "TU",
      stop: "Stop",
      reset: "Reset",
      help: "HELP"
    },
    results: {
      title: "Contest Mode Results"
    },
    activeStations: "Active Stations:"
  },
  ru: {
    title: "Морзянка",
    subtitle: "Сначала ходи, потом беги!",
    modes: {
      singleCaller: "Одна станция",
      basicContest: "Базовый контест",
      potaActivator: "POTA Активатор",
      cwt: "CWT",
      k1usnSST: "K1USN SST"
    },
    yourStation: {
      title: "Настройки вашей станции",
      callsign: "Позывной",
      firstName: "Имя",
      state: "Область/Регион",
      speed: "Скорость (WPM)",
      sidetone: "Тон (Hz)",
      sidetoneVolume: "Громкость тона"
    },
    respondingStation: {
      title: "Настройки отвечающих станций"
    },
    effects: {
      title: "Настройки эффектов"
    },
    buttons: {
      cq: "CQ",
      send: "Отправить",
      tu: "TU",
      stop: "Стоп",
      reset: "Сброс",
      help: "ПОМОЩЬ"
    },
    results: {
      title: "Результаты контеста"
    },
    activeStations: "Активных станций:"
  }
};

let currentLang = localStorage.getItem('language') || 'en';

function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

function updateUI() {
  console.log('Updating UI to language:', currentLang);
  
  // Заголовок
  const title = document.querySelector('h1.mb-0');
  if (title) {
    const textNode = Array.from(title.childNodes).find(node => node.nodeType === 3);
    if (textNode) {
      textNode.textContent = t('title') + ' ';
    }
  }
  
  const subtitle = document.querySelector('.fw-bold.fst-italic');
  if (subtitle) subtitle.textContent = t('subtitle');
  
  // Режимы
  const modeLabel = document.querySelector('h3');
  if (modeLabel && modeLabel.textContent.trim() === 'Mode') {
    modeLabel.textContent = currentLang === 'ru' ? 'Режим' : 'Mode';
  }
  
  const modeSingle = document.querySelector('label[for="modeSingle"]');
  if (modeSingle) modeSingle.textContent = t('modes.singleCaller');
  
  const modeContest = document.querySelector('label[for="modeContest"]');
  if (modeContest) modeContest.textContent = t('modes.basicContest');
  
  const modePota = document.querySelector('label[for="modePota"]');
  if (modePota) modePota.textContent = t('modes.potaActivator');
  
  const modeCwt = document.querySelector('label[for="modeCwt"]');
  if (modeCwt) modeCwt.textContent = t('modes.cwt');
  
  const modeSst = document.querySelector('label[for="modeSst"]');
  if (modeSst) modeSst.textContent = t('modes.k1usnSST');
  
  // Настройки станции
  const yourStationTitle = document.querySelector('#headingYourStation h5');
  if (yourStationTitle) yourStationTitle.textContent = t('yourStation.title');
  
  const callsignLabel = document.querySelector('label[for="yourCallsign"]');
  if (callsignLabel) callsignLabel.textContent = t('yourStation.callsign');
  
  const nameLabel = document.querySelector('label[for="yourName"]');
  if (nameLabel) nameLabel.textContent = t('yourStation.firstName');
  
  const stateLabel = document.querySelector('label[for="yourState"]');
  if (stateLabel) stateLabel.textContent = t('yourStation.state');
  
  const speedLabel = document.querySelector('label[for="yourSpeed"]');
  if (speedLabel) speedLabel.textContent = t('yourStation.speed');
  
  const sidetoneLabel = document.querySelector('label[for="yourSidetone"]');
  if (sidetoneLabel) sidetoneLabel.textContent = t('yourStation.sidetone');
  
  const volumeLabel = document.querySelector('label[for="yourVolume"]');
  if (volumeLabel) volumeLabel.textContent = t('yourStation.sidetoneVolume');
  
  // Responding Station Settings
  const respondingTitle = document.querySelector('#headingRespondingStationSettings h5');
  if (respondingTitle) respondingTitle.textContent = t('respondingStation.title');
  
  // Effects Settings
  const effectsTitle = document.querySelector('#headingEffects h5');
  if (effectsTitle) effectsTitle.textContent = t('effects.title');
  
  // Кнопки
  const cqButton = document.getElementById('cqButton');
  if (cqButton) cqButton.textContent = t('buttons.cq');
  
  const sendButton = document.getElementById('sendButton');
  if (sendButton) sendButton.textContent = t('buttons.send');
  
  const tuButton = document.getElementById('tuButton');
  if (tuButton) tuButton.textContent = t('buttons.tu');
  
  const stopButton = document.getElementById('stopButton');
  if (stopButton) stopButton.textContent = t('buttons.stop');
  
  const resetButton = document.getElementById('resetButton');
  if (resetButton) resetButton.textContent = t('buttons.reset');
  
  // Active Stations
  const activeStationsLabel = document.querySelector('strong');
  if (activeStationsLabel && activeStationsLabel.textContent.includes('Active Stations')) {
    activeStationsLabel.textContent = t('activeStations');
  }
  
  // Results
  const resultsHeader = document.querySelector('h3');
  const headers = document.querySelectorAll('h3');
  headers.forEach(h => {
    if (h.textContent.includes('Contest Mode Results') || h.textContent.includes('Результаты контеста')) {
      h.textContent = t('results.title');
    }
  });
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  
  currentLang = lang;
  localStorage.setItem('language', lang);
  
  // Обновляем активную кнопку
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`lang-${lang}`)?.classList.add('active');
  
  updateUI();
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  console.log('Localization initialized');
  
  // Устанавливаем сохраненный язык
  const savedLang = localStorage.getItem('language') || 'en';
  
  // Обновляем активную кнопку
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`lang-${savedLang}`)?.classList.add('active');
  
  currentLang = savedLang;
  updateUI();
  
  // Обработчики переключения языка
  const enBtn = document.getElementById('lang-en');
  const ruBtn = document.getElementById('lang-ru');
  
  if (enBtn) {
    enBtn.addEventListener('click', () => {
      console.log('Switching to EN');
      setLanguage('en');
    });
  }
  
  if (ruBtn) {
    ruBtn.addEventListener('click', () => {
      console.log('Switching to RU');
      setLanguage('ru');
    });
  }
});