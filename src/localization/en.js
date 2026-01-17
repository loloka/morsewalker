// localization/en.js
export const en = {
  title: 'Morse Walker',
  subtitle: 'Walk before you run!',
  mode: 'Mode',
  modes: {
    singleCaller: 'Single Caller',
    basicContest: 'Basic Contest',
    potaActivator: 'POTA Activator',
    rda: 'RDA Contest',
    cwt: 'CWT',
    k1usnSST: 'K1USN SST',
    hst: 'HST', // ← Добавлено
    wpx: 'WPX', // ← Добавлено
  },
  yourStation: {
    title: 'Your Station Settings',
    callsign: 'Callsign',
    firstName: 'First Name',
    state: 'State',
    speed: 'Speed (WPM)',
    sidetone: 'Sidetone (Hz)',
    sidetoneVolume: 'Sidetone Volume',
  },
  respondingStation: {
    title: 'Responding Station Settings',
    maxStations: 'Maximum Stations',
    minSpeed: 'Min Speed',
    maxSpeed: 'Max Speed',
    farnsworth: 'Farnsworth',
    effectiveSpeed: 'Effective Speed (WPM)',
    minTone: 'Min Tone (Hz)',
    maxTone: 'Max Tone (Hz)',
    minVolume: 'Min Volume',
    maxVolume: 'Max Volume',
    minWait: 'Min Wait (s)',
    maxWait: 'Max Wait (s)',
    usOnly: 'US Only Callsigns',
    callsignFormat: 'Callsign Format Options',
    enableCutNumbers: 'Enable Cut Numbers',
    cutNumberOptions: 'Cut Number Options',
    russianOnly: 'Russian Only Callsigns',
  },
  effects: {
    title: 'Effects Settings',
    qrn: 'QRN (Atmospheric Noise)',
    qsb: 'QSB (Fading)',
    stationsWithQSB: 'Stations with QSB',
    off: 'Off',
    normal: 'Normal',
    moderate: 'Moderate',
    heavy: 'Heavy',
  },
  buttons: {
    cq: 'CQ',
    send: 'Send',
    tu: 'TU',
    stop: 'Stop',
    reset: 'Reset',
    help: 'HELP',
  },
  inputs: {
    response: 'Response',
    serialNumber: 'Serial Number',
  },
  results: {
    title: 'Contest Results',
    number: '#',
    callsign: 'Callsign',
    wpm: 'WPM',
    attempts: 'Attempts',
    totalTime: 'Total Time',
    serialNumber: 'Serial Number',
    additionalInfo: 'Additional Info',
  },

  // 🏆 New Scoreboard Section
  scoreboard: {
    title: 'Scoreboard',
    qsos: 'QSOs',
    points: 'Points',
    multipliers: 'Multipliers',
    total: 'Total Score',
    accuracy: 'Accuracy',
    mistakes: 'Mistakes',
    dupes: 'Dupes',
  },

  // 🎮 New Competition Section
  competition: {
    start: 'Start Competition Mode',
  },

  betaWarning: {
    text: 'Morse Walker is currently in <strong>beta</strong> and <em>your feedback is invaluable!</em>',
    submitIssue: 'Submit an issue',
    forBugs: 'for bugs or feature requests, or email',
  },
  help: {
    title: 'Getting Started',
    cheatTitle: 'How to "Cheat"',
    cheatText:
      "If you feel like you need a little extra help to get started, open your browser's JavaScript console to see behind the scenes information, such as which stations are calling.",

    step1Title: 'Click "CQ" to start calling',
    step1Text:
      'Up to your "Max Stations" will respond. It may start slowly, often with just one or two stations initially. If you want more stations, just call CQ again!',

    step2Title: 'Enter the callsign',
    step2Text: "Enter the callsign of the station you'd like to work.",
    step2List: [
      "Send 'AGN', 'AGN?', or '?' to request all stations to repeat themselves.",
      "Use partial matches to single out stations in a pileup. E.g., for W6NYC, all of the following will get a reply back: 'W?', 'W6?', 'W6NC', 'NYC'.",
      'Note that more than one station may reply if they match your partial pattern!',
      'Send "QRS" to have the last responding stations slow down by adding 6 WPM to their Farnsworth spacing.',
    ],

    step3Title: 'Click "Send"',
    step3Text:
      'Click "Send" to transmit whatever you\'ve entered in the Response text field. Use this to respond to a station.',

    step4Title: 'Fill in mode-specific fields',
    step4Text:
      'These mode-specific fields appear when you need to enter extra details, such as a name, state, or a contest serial number. Filling these in are completely optional before clicking "TU".',

    step5Title: 'Click "TU"',
    step5Text:
      'After completing an exchange, click "TU" to send a wrap-up, thank you message. Each mode has a slightly different way of completing. After clicking TU, new stations sometimes hop in! But, in case they don\'t, you can always go back and click CQ.',

    stopTitle: 'Stop',
    stopText: 'Halts the current transmission or activity.',

    resetTitle: 'Reset',
    resetText:
      'Clears all entries and starts you fresh, ready to begin a new contact sequence.',
  },
  activeStations: 'Active Stations:',
  gettingStarted: 'Getting Started',
  helpModal: {
    cheat: 'How to "Cheat"',
    cheatText:
      "If you need a little extra help to get started, open your browser's JavaScript console to see behind the scenes information, such as which stations are calling.",
  },
};
