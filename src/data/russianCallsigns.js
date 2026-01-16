// js/data/russianCallsigns.js

// Российские префиксы
export const russianPrefixes = [
  'R',
  'U', // Основные российские префиксы
  'RA',
  'RK',
  'RN', // Любительские
  'RW',
  'RZ', // Дополнительные
  'UA',
  'UB',
  'UC',
  'UD',
  'UE',
  'UF',
  'UG',
  'UH',
  'UI', // Региональные U-префиксы
];

// Российские области и регионы (по федеральным округам)
export const russianRegions = {
  // Центральный федеральный округ
  MOW: 'Москва',
  MOS: 'Московская обл.',
  VOR: 'Воронежская обл.',
  TUL: 'Тульская обл.',
  KLU: 'Калужская обл.',
  RYA: 'Рязанская обл.',
  SMO: 'Смоленская обл.',
  TVE: 'Тверская обл.',
  YAR: 'Ярославская обл.',
  BRY: 'Брянская обл.',
  VLA: 'Владимирская обл.',
  IVA: 'Ивановская обл.',
  KOS: 'Костромская обл.',
  ORL: 'Орловская обл.',
  TAM: 'Тамбовская обл.',
  BEL: 'Белгородская обл.',
  KUR: 'Курская обл.',
  LIP: 'Липецкая обл.',

  // Северо-Западный федеральный округ
  SPE: 'Санкт-Петербург',
  LEN: 'Ленинградская обл.',
  PSK: 'Псковская обл.',
  NGR: 'Новгородская обл.',
  VLG: 'Вологодская обл.',
  MUR: 'Мурманская обл.',
  ARK: 'Архангельская обл.',
  KRL: 'Карелия',
  KOM: 'Коми',
  NEN: 'Ненецкий АО',

  // Приволжский федеральный округ
  NIZ: 'Нижний Новгород',
  KIR: 'Кировская обл.',
  SAM: 'Самарская обл.',
  SAR: 'Саратовская обл.',
  ORE: 'Оренбургская обл.',
  PNZ: 'Пензенская обл.',
  ULY: 'Ульяновская обл.',
  TAT: 'Татарстан',
  BAS: 'Башкортостан',
  MAR: 'Марий Эл',
  MOR: 'Мордовия',
  CHU: 'Чувашия',
  UDM: 'Удмуртия',
  PER: 'Пермский край',

  // Южный федеральный округ
  ROS: 'Ростовская обл.',
  VGG: 'Волгоградская обл.',
  AST: 'Астраханская обл.',
  KDA: 'Краснодарский край',
  STA: 'Ставропольский край',
  ADP: 'Адыгея',
  KLM: 'Калмыкия',
  KRM: 'Крым',
  SEV: 'Севастополь',

  // Уральский федеральный округ
  SVE: 'Свердловская обл.',
  CHE: 'Челябинская обл.',
  TYU: 'Тюменская обл.',
  KGN: 'Курганская обл.',
  YAN: 'Ямало-Ненецкий АО',
  KHM: 'Ханты-Мансийский АО',

  // Сибирский федеральный округ
  NVS: 'Новосибирская обл.',
  OMS: 'Омская обл.',
  TOM: 'Томская обл.',
  KEM: 'Кемеровская обл.',
  ALT: 'Алтайский край',
  KRA: 'Красноярский край',
  IRK: 'Иркутская обл.',
  BUR: 'Бурятия',
  ZAB: 'Забайкальский край',
  TYV: 'Тыва',
  KHA: 'Хакасия',
  ALA: 'Алтай (респ.)',

  // Дальневосточный федеральный округ
  VLA: 'Приморский край',
  KHA: 'Хабаровский край',
  AMU: 'Амурская обл.',
  SAK: 'Сахалинская обл.',
  MAG: 'Магаданская обл.',
  KAM: 'Камчатский край',
  CHU: 'Чукотский АО',
  YEV: 'Еврейская АО',
};

// Генератор российских позывных
export function generateRussianCallsign(format = '2x2') {
  const prefix =
    russianPrefixes[Math.floor(Math.random() * russianPrefixes.length)];
  const digit = Math.floor(Math.random() * 10);

  let suffix = '';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  switch (format) {
    case '1x1':
      suffix = letters[Math.floor(Math.random() * letters.length)];
      break;
    case '1x2':
      suffix =
        letters[Math.floor(Math.random() * letters.length)] +
        letters[Math.floor(Math.random() * letters.length)];
      break;
    case '1x3':
      suffix =
        letters[Math.floor(Math.random() * letters.length)] +
        letters[Math.floor(Math.random() * letters.length)] +
        letters[Math.floor(Math.random() * letters.length)];
      break;
    case '2x1':
      suffix = letters[Math.floor(Math.random() * letters.length)];
      break;
    case '2x2':
      suffix =
        letters[Math.floor(Math.random() * letters.length)] +
        letters[Math.floor(Math.random() * letters.length)];
      break;
    case '2x3':
      suffix =
        letters[Math.floor(Math.random() * letters.length)] +
        letters[Math.floor(Math.random() * letters.length)] +
        letters[Math.floor(Math.random() * letters.length)];
      break;
    default:
      suffix =
        letters[Math.floor(Math.random() * letters.length)] +
        letters[Math.floor(Math.random() * letters.length)];
  }

  return `${prefix}${digit}${suffix}`;
}

// Получить случайный российский регион
export function getRandomRussianRegion() {
  const regions = Object.keys(russianRegions);
  return regions[Math.floor(Math.random() * regions.length)];
}

// Получить название региона по коду
export function getRussianRegionName(code) {
  return russianRegions[code] || code;
}
