// localization/en.js
export const en = {
  title: "Morse Walker",
  subtitle: "Walk before you run!",
  mode: "Mode",
  modes: {
    singleCaller: "Single Caller",
    basicContest: "Basic Contest",
    potaActivator: "POTA Activator",
    rda: "RDA",
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
    title: "Responding Station Settings",
    maxStations: "Maximum Stations",
    minSpeed: "Min Speed",
    maxSpeed: "Max Speed",
    farnsworth: "Farnsworth",
    effectiveSpeed: "Effective Speed (WPM)",
    minTone: "Min Tone (Hz)",
    maxTone: "Max Tone (Hz)",
    minVolume: "Min Volume",
    maxVolume: "Max Volume",
    minWait: "Min Wait (s)",
    maxWait: "Max Wait (s)",
    usOnly: "US Only Callsigns",
    callsignFormat: "Callsign Format Options",
    enableCutNumbers: "Enable Cut Numbers",
    cutNumberOptions: "Cut Number Options",
    russianOnly: "Russian Only Callsigns"
  },
  effects: {
    title: "Effects Settings",
    qrn: "QRN (Atmospheric Noise)",
    qsb: "QSB (Fading)",
    stationsWithQSB: "Stations with QSB",
    off: "Off",
    normal: "Normal",
    moderate: "Moderate",
    heavy: "Heavy"
  },
  buttons: {
    cq: "CQ",
    send: "Send",
    tu: "TU",
    stop: "Stop",
    reset: "Reset",
    help: "HELP"
  },
  inputs: {
    response: "Response",
    serialNumber: "Serial Number"
  },
  results: {
    title: "Contest Mode Results",
    number: "#",
    callsign: "Callsign",
    wpm: "WPM",
    attempts: "Attempts",
    totalTime: "Total Time",
    serialNumber: "Serial Number",
    additionalInfo: "Additional Info"
  },
  betaWarning: {
    text: "Morse Walker is currently in <strong>beta</strong> and <em>your feedback is invaluable!</em>",
    submitIssue: "Submit an issue",
    forBugs: "for bugs or feature requests, or email"
  },
  help: {
      title: 'Начало работы',
      cheatTitle: 'Как "подсмотреть"',
      cheatText: 'Если нужна небольшая помощь для начала, откройте консоль JavaScript в браузере, чтобы увидеть информацию за кулисами, например, какие станции вызывают вас.',
      
      step1Title: 'Нажмите "CQ" для начала вызова',
      step1Text: 'Ответят до "Макс. станций". Может начаться медленно, часто всего с одной или двумя станциями. Если хотите больше станций, просто вызовите CQ снова!',
      
      step2Title: 'Введите позывной',
      step2Text: 'Введите позывной станции, с которой хотите провести QSO.',
      step2List: [
        'Отправьте \'AGN\', \'AGN?\' или \'?\', чтобы попросить все станции повторить.',
        'Используйте частичное совпадение для выделения станций в pile-up. Например, для W6NYC подойдут: \'W?\', \'W6?\', \'W6NC\', \'NYC\'.',
        'Обратите внимание, что может ответить более одной станции, если они соответствуют вашему шаблону!',
        'Отправьте "QRS", чтобы последние ответившие станции замедлились, добавив 6 WPM к интервалу Farnsworth.'
      ],
      
      step3Title: 'Нажмите "Отправить"',
      step3Text: 'Нажмите "Отправить", чтобы передать то, что вы ввели в поле ответа. Используйте это для ответа станции.',
      
      step4Title: 'Заполните поля режима',
      step4Text: 'Эти поля появляются, когда нужно ввести дополнительные детали, такие как имя, область или серийный номер контеста. Их заполнение полностью необязательно перед нажатием "TU".',
      
      step5Title: 'Нажмите "TU"',
      step5Text: 'После завершения обмена нажмите "TU", чтобы отправить завершающее сообщение благодарности. Каждый режим имеет немного отличающийся способ завершения. После нажатия TU иногда появляются новые станции! Но если этого не произошло, всегда можно вернуться и нажать CQ.',
      
      stopTitle: 'Стоп',
      stopText: 'Останавливает текущую передачу или активность.',
      
      resetTitle: 'Сброс',
      resetText: 'Очищает все записи и позволяет начать новую последовательность связей.'
    },
    
  activeStations: "Active Stations:",
  gettingStarted: "Getting Started",
  helpModal: {
    cheat: "How to \"Cheat\"",
    cheatText: "If you feel like you need a little extra help to get started, open your browser's JavaScript console to see behind the scenes information, such as which stations are calling."
  }
};