import { getInputs } from './inputs.js';
import { isRussianCallsign, getRandomRDARegion } from './rda-regions.js';

// US Callsign Prefixes (оригинальные)
const US_CALLSIGN_PREFIXES_WEIGHTED = [
  { value: 'K', weight: 40 },
  { value: 'W', weight: 25 },
  { value: 'N', weight: 20 },
  { value: 'AA', weight: 2 },
  { value: 'AB', weight: 2 },
  { value: 'AC', weight: 2 },
  { value: 'AD', weight: 1 },
  { value: 'AE', weight: 1 },
  { value: 'AF', weight: 1 },
  { value: 'AG', weight: 1 },
  { value: 'AH', weight: 1 },
  { value: 'AI', weight: 1 },
  { value: 'AJ', weight: 1 },
  { value: 'AK', weight: 1 },
  { value: 'AL', weight: 1 },
];

// 🇷🇺 Российские префиксы с весами
const RUSSIAN_CALLSIGN_PREFIXES_WEIGHTED = [
  { value: 'R', weight: 30 }, // 30%
  { value: 'U', weight: 25 }, // 25%
  { value: 'RA', weight: 15 }, // 15%
  { value: 'RW', weight: 10 }, // 10%
  { value: 'RK', weight: 5 }, // 5%
  { value: 'RN', weight: 5 }, // 5%
  { value: 'RZ', weight: 3 }, // 3%
  { value: 'UA', weight: 2 }, // 2%
  { value: 'UB', weight: 1 }, // 1%
  { value: 'UC', weight: 1 }, // 1%
  { value: 'UD', weight: 1 }, // 1%
  { value: 'UE', weight: 1 }, // 1%
];

const NON_US_CALLSIGN_PREFIXES = [
  '9A',
  'CT',
  'DL',
  'E',
  'EA',
  'EI',
  'ES',
  'EU',
  'F',
  'G',
  'GM',
  'GW',
  'HA',
  'HB',
  'I',
  'JA',
  'LA',
  'LU',
  'LY',
  'LZ',
  'OE',
  'OH',
  'OK',
  'OM',
  'ON',
  'OZ',
  'PA',
  'PY',
  'S',
  'SM',
  'SP',
  'SV',
  'UA',
  'UR',
  'VE',
  'VK',
  'YO',
  'YT',
];

const stateAbbreviations = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
];

// 🇷🇺 Российские регионы (сокращения для радиолюбительских обменов)
const russianRegions = [
  'MOW',
  'MOS',
  'SPE',
  'LEN',
  'SVE',
  'CHE',
  'NVS',
  'KRA',
  'ROS',
  'NIZ',
  'SAM',
  'VOR',
  'KDA',
  'TYU',
  'OMS',
  'PER',
  'VGG',
  'UFA',
  'TAT',
  'IRK',
  'SAR',
  'TOM',
  'KEM',
  'ORE',
  'KIR',
  'YAR',
  'TVE',
  'ULY',
  'KLU',
  'BRY',
  'VLA',
  'RYA',
  'PNZ',
  'LIP',
  'TUL',
  'KUR',
  'AST',
  'BEL',
  'ORL',
  'KOS',
  'PSK',
  'NGR',
  'VLG',
  'SMO',
  'TAM',
  'IVA',
  'STA',
  'ALT',
  'ZAB',
  'BUR',
  'ARK',
  'MUR',
  'KRL',
  'KOM',
  'KGN',
  'MAG',
  'SAK',
  'KAM',
  'AMU',
  'YAN',
  'KHM',
  'NEN',
  'CHU',
  'ADP',
  'KLM',
  'TYV',
  'KHA',
  'ALA',
  'MAR',
  'MOR',
  'UDM',
  'BAS',
  'KRM',
  'SEV',
  'YEV',
];

const names = [
  'Adam',
  'Ahmed',
  'Ali',
  'Amanda',
  'Amy',
  'Ana',
  'Andrew',
  'Angela',
  'Anna',
  'Anthony',
  'Aria',
  'Ashley',
  'Barbara',
  'Benjamin',
  'Brandon',
  'Brian',
  'Charles',
  'Christopher',
  'Cynthia',
  'Daniel',
  'David',
  'Deborah',
  'Dennis',
  'Donna',
  'Dorothy',
  'Edward',
  'Elena',
  'Elizabeth',
  'Emily',
  'Eric',
  'Fatima',
  'Frank',
  'George',
  'Gregory',
  'Heather',
  'Henry',
  'Hong',
  'Jack',
  'Jacob',
  'James',
  'Jason',
  'Jeffrey',
  'Jennifer',
  'Jessica',
  'John',
  'Jonathan',
  'Joseph',
  'Joshua',
  'Justin',
  'Karen',
  'Katherine',
  'Kathleen',
  'Kevin',
  'Kimberly',
  'Larry',
  'Laura',
  'Linda',
  'Lisa',
  'Maria',
  'Margaret',
  'Mark',
  'Mary',
  'Matthew',
  'Melissa',
  'Michael',
  'Michelle',
  'Mohammad',
  'Nancy',
  'Nicole',
  'Nicholas',
  'Noor',
  'Patricia',
  'Patrick',
  'Paul',
  'Peter',
  'Rebecca',
  'Richard',
  'Robert',
  'Ronald',
  'Ryan',
  'Sandra',
  'Sarah',
  'Scott',
  'Shirley',
  'Sofia',
  'Stephanie',
  'Stephen',
  'Steven',
  'Susan',
  'Thomas',
  'Timothy',
  'Tyler',
  'Wei',
  'William',
  'Yan',
];

// 🇷🇺 Русские имена
const russianNames = [
  'Александр',
  'Алексей',
  'Андрей',
  'Анатолий',
  'Антон',
  'Борис',
  'Вадим',
  'Валерий',
  'Василий',
  'Виктор',
  'Виталий',
  'Владимир',
  'Владислав',
  'Вячеслав',
  'Геннадий',
  'Георгий',
  'Григорий',
  'Дмитрий',
  'Евгений',
  'Егор',
  'Иван',
  'Игорь',
  'Илья',
  'Кирилл',
  'Константин',
  'Леонид',
  'Максим',
  'Михаил',
  'Николай',
  'Олег',
  'Павел',
  'Петр',
  'Роман',
  'Сергей',
  'Станислав',
  'Юрий',
  'Ярослав',
];

// 🆕 Счётчик для нероссийских станций в RDA Contest
let nonRussianSerialNumber = 1;

export function getYourStation() {
  let inputs = getInputs();
  if (inputs === null) return;

  return {
    callsign: inputs.yourCallsign,
    wpm: inputs.yourSpeed,
    volume: inputs.yourVolume,
    frequency: inputs.yourSidetone,
    name: inputs.yourName,
    state: inputs.yourState,
    player: null,
    qsb: false,
  };
}

export function getCallingStation() {
  let inputs = getInputs();
  if (inputs === null) return;

  // 🇷🇺 Определяем тип станции: US, Russian, или International
  let stationType = 'international';

  if (inputs.usOnly) {
    stationType = 'us';
  } else if (inputs.russianOnly) {
    stationType = 'russian';
  } else {
    // 40% US, 30% Russian, 30% International
    const rand = Math.random();
    if (rand < 0.4) {
      stationType = 'us';
    } else if (rand < 0.7) {
      stationType = 'russian';
    } else {
      stationType = 'international';
    }
  }

  let callsign, state, name, rdaRegion, serialNumber;

  switch (stationType) {
    case 'us':
      callsign = getRandomUSCallsign(inputs.formats);
      state = randomElement(stateAbbreviations);
      name = randomElement(names);
      break;
    case 'russian':
      callsign = getRandomRussianCallsign(inputs.formats);
      state = randomElement(russianRegions);
      name = randomElement(russianNames);
      rdaRegion = getRandomRDARegion(); // 🆕 Для RDA Contest
      break;
    default:
      callsign = getRandomNonUSCallsign(inputs.formats);
      state = '';
      name = randomElement(names);
  }

  // 🆕 Определяем exchange для RDA режима
  let rdaExchange;
  if (isRussianCallsign(callsign)) {
    rdaExchange = rdaRegion || getRandomRDARegion();
  } else {
    rdaExchange = String(nonRussianSerialNumber).padStart(3, '0');
    nonRussianSerialNumber++;
  }

  return {
    callsign,
    wpm:
      Math.floor(Math.random() * (inputs.maxSpeed - inputs.minSpeed + 1)) +
      inputs.minSpeed,
    enableFarnsworth: inputs.enableFarnsworth,
    farnsworthSpeed: inputs.farnsworthSpeed || null,
    volume:
      Math.random() * (inputs.maxVolume - inputs.minVolume) + inputs.minVolume,
    frequency: Math.floor(
      Math.random() * (inputs.maxTone - inputs.minTone) + inputs.minTone
    ),
    name,
    state,
    serialNumber: (Math.floor(Math.random() * 30) + 1)
      .toString()
      .padStart(2, '0'),
    cwopsNumber: Math.floor(Math.random() * 4000) + 1,
    rdaRegion: rdaExchange, // 🆕 RDA обмен
    park: generatePotaPark(stationType), // 🆕 POTA обмен
    player: null,
    qsb: inputs.qsb ? Math.random() < inputs.qsbPercentage / 100 : false,
    qsbFrequency: Math.random() * 0.45 + 0.05,
    qsbDepth: Math.random() * 0.4 + 0.6,
  };
}

// 🆕 Функция для сброса счётчика (вызывать при сбросе симуляции)
export function resetRDASerialNumber() {
  nonRussianSerialNumber = 1;
}

/**
 * 🆕 Номер парка для POTA — раньше не генерировался вообще (`station.park`
 * был всегда undefined), из-за чего сверка обмена в POTA была невозможна:
 * classifyExchangeField сравнивал бы ввод пользователя с undefined и всегда
 * получал "N/A, correct: true", какой бы номер парка пользователь ни ввёл.
 *
 * Формат — country-prefix + 4-значный номер (реальный формат POTA-референсов,
 * например US-1234, RU-1234). Для international-станций честного маппинга
 * "позывной → страна → код парка" в проекте пока нет (NON_US_CALLSIGN_PREFIXES
 * не привязаны к POTA-кодам стран), поэтому используется DX-XXXX как явная
 * заглушка, а не попытка выдать её за реальный код страны.
 */
function generatePotaPark(stationType) {
  const prefix =
    stationType === 'us' ? 'US' : stationType === 'russian' ? 'RU' : 'DX';
  const number = (Math.floor(Math.random() * 9999) + 1)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${number}`;
}

function getRandomUSCallsign(formats) {
  const format = randomElement(formats);
  const number = randomDigit();

  let possiblePrefixes;
  if (format.startsWith('1x')) {
    possiblePrefixes = US_CALLSIGN_PREFIXES_WEIGHTED.filter(
      (item) => item.value.length === 1
    );
  } else {
    possiblePrefixes = US_CALLSIGN_PREFIXES_WEIGHTED;
  }

  const prefix = weightedRandomElement(possiblePrefixes);
  let prefixLettersToGenerate = parseInt(format.slice(0, 1)) - prefix.length;

  switch (format) {
    case '1x1':
      return `${prefix}${number}${generateRandomLetters(1)}`;
    case '1x2':
      return `${prefix}${number}${generateRandomLetters(2)}`;
    case '1x3':
      return `${prefix}${number}${generateRandomLetters(3)}`;
    case '2x1':
      return `${prefix}${generateRandomLetters(prefixLettersToGenerate)}${number}${generateRandomLetters(1)}`;
    case '2x2':
      return `${prefix}${generateRandomLetters(prefixLettersToGenerate)}${number}${generateRandomLetters(2)}`;
    case '2x3':
      return `${prefix}${generateRandomLetters(prefixLettersToGenerate)}${number}${generateRandomLetters(3)}`;
    default:
      return `${prefix}${number}${generateRandomLetters(3)}`;
  }
}

// 🇷🇺 Генератор российских позывных
function getRandomRussianCallsign(formats) {
  const format = randomElement(formats);
  const number = randomDigit();

  let possiblePrefixes;
  if (format.startsWith('1x')) {
    possiblePrefixes = RUSSIAN_CALLSIGN_PREFIXES_WEIGHTED.filter(
      (item) => item.value.length === 1
    );
  } else {
    possiblePrefixes = RUSSIAN_CALLSIGN_PREFIXES_WEIGHTED;
  }

  const prefix = weightedRandomElement(possiblePrefixes);
  let prefixLettersToGenerate = parseInt(format.slice(0, 1)) - prefix.length;

  switch (format) {
    case '1x1':
      return `${prefix}${number}${generateRandomLetters(1)}`;
    case '1x2':
      return `${prefix}${number}${generateRandomLetters(2)}`;
    case '1x3':
      return `${prefix}${number}${generateRandomLetters(3)}`;
    case '2x1':
      return `${prefix}${generateRandomLetters(prefixLettersToGenerate)}${number}${generateRandomLetters(1)}`;
    case '2x2':
      return `${prefix}${generateRandomLetters(prefixLettersToGenerate)}${number}${generateRandomLetters(2)}`;
    case '2x3':
      return `${prefix}${generateRandomLetters(prefixLettersToGenerate)}${number}${generateRandomLetters(3)}`;
    default:
      return `${prefix}${number}${generateRandomLetters(3)}`;
  }
}

function getRandomNonUSCallsign(formats) {
  let prefix, format;
  do {
    prefix = randomElement(NON_US_CALLSIGN_PREFIXES);
    format = randomElement(formats);
  } while (format.startsWith('1x') && prefix.length !== 1);

  const number = randomDigit();
  const lettersBeforeNumber = format.startsWith('2x') ? 2 - prefix.length : 0;
  const lettersAfterNumber = parseInt(format.slice(-1));

  return `${prefix}${generateRandomLetters(lettersBeforeNumber)}${number}${generateRandomLetters(lettersAfterNumber)}`;
}

function generateRandomLetters(length) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length }, () => randomElement(alphabet)).join('');
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function weightedRandomElement(weightedArray) {
  const totalWeight = weightedArray.reduce((sum, item) => sum + item.weight, 0);
  let randomValue = Math.random() * totalWeight;

  for (const item of weightedArray) {
    randomValue -= item.weight;
    if (randomValue <= 0) {
      return item.value;
    }
  }
  return null;
}

function randomDigit() {
  return Math.floor(Math.random() * 10);
}
