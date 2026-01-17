// src/js/modes.js

export const modes = {
  single: {
    ui: {
      showTuButton: false,
      showInfoField: false,
      showInfoField2: false,
      tableExtraColumn: false,
      resultsHeader: 'Single Caller Training',
    },
    logic: {
      showTuStep: false,
      cqMessage: (your, their, arb) =>
        `CQ CQ ${your.callsign} ${your.callsign} K`,
      yourExchange: (your, their, arb) =>
        `${their.callsign} 599 ${your.name} ${your.state}`,
      theirExchange: (your, their, arb) => `R 599 ${their.name} ${their.state}`,
      yourSignoff: (your, their, arb) => `TU ${their.name} 73`,
      theirSignoff: (your, their, arb) => `73 ${your.callsign}`,
    },
  },

  contest: {
    ui: {
      showTuButton: true,
      showInfoField: true,
      infoFieldPlaceholder: 'Serial Number',
      showInfoField2: false,
      tableExtraColumn: true,
      extraColumnHeader: 'Serial',
      resultsHeader: 'Contest Results',
    },
    logic: {
      showTuStep: true,
      requiresInfoField: true,
      extraInfoFieldKey: 'serialNumber',
      cqMessage: (your, their, arb) =>
        `CQ CQ ${your.callsign} ${your.callsign} TEST`,
      yourExchange: (your, their, arb) =>
        `${their.callsign} 599 ${your.serialNumber} ${your.name} ${your.state}`,
      theirExchange: (your, their, arb) =>
        `R 599 ${their.serialNumber} ${their.name} ${their.state}`,
      yourSignoff: (your, their, arb) => `TU`,
      theirSignoff: (your, their, arb) => `TU ${your.callsign}`,
    },
  },

  pota: {
    ui: {
      showTuButton: true,
      showInfoField: true,
      infoFieldPlaceholder: 'Park Reference (e.g., K-1234)',
      showInfoField2: false,
      tableExtraColumn: true,
      extraColumnHeader: 'Park',
      resultsHeader: 'POTA Activation Log',
    },
    logic: {
      showTuStep: true,
      requiresInfoField: true,
      extraInfoFieldKey: 'park',
      cqMessage: (your, their, arb) =>
        `CQ CQ POTA ${your.callsign} ${your.callsign} K`,
      yourExchange: (your, their, arb) => `${their.callsign} 599 ${your.state}`,
      theirExchange: (your, their, arb) => `R 599 ${their.park || 'K-1234'}`,
      yourSignoff: (your, their, arb) => `TU ${arb || 'K-1234'} 73`,
      theirSignoff: (your, their, arb) => `73 ${your.callsign}`,
    },
  },

  rda: {
    ui: {
      showTuButton: true,
      showInfoField: true,
      infoFieldPlaceholder: 'Region (e.g., MO-01)',
      showInfoField2: false,
      tableExtraColumn: true,
      extraColumnHeader: 'Region',
      resultsHeader: 'RDA Contest Log',
    },
    logic: {
      showTuStep: true,
      requiresInfoField: true,
      extraInfoFieldKey: 'region',
      cqMessage: (your, their, arb) =>
        `CQ CQ RDA ${your.callsign} ${your.callsign} TEST`,
      yourExchange: (your, their, arb) =>
        `${their.callsign} 599 ${your.region || 'MO-01'}`,
      theirExchange: (your, their, arb) => `R 599 ${their.region}`,
      yourSignoff: (your, their, arb) => `TU ${arb || their.region} 73`,
      theirSignoff: (your, their, arb) => `TU 73`,
    },
  },

  cwt: {
    ui: {
      showTuButton: true,
      showInfoField: true,
      infoFieldPlaceholder: 'Name',
      showInfoField2: true,
      infoField2Placeholder: 'State/Province',
      tableExtraColumn: true,
      extraColumnHeader: 'Name / State',
      resultsHeader: 'CWT Log',
    },
    logic: {
      showTuStep: true,
      requiresInfoField: true,
      requiresInfoField2: true,
      extraInfoFieldKey: 'name',
      extraInfoFieldKey2: 'state',
      cqMessage: (your, their, arb) =>
        `CQ CQ ${your.callsign} ${your.callsign} TEST`,
      yourExchange: (your, their, arb) =>
        `${their.callsign} ${your.name} ${your.state}`,
      theirExchange: (your, their, arb) => `R ${their.name} ${their.state}`,
      yourSignoff: (your, their, arb) => `TU`,
      theirSignoff: (your, their, arb) => `TU`,
    },
  },

  sst: {
    ui: {
      showTuButton: true,
      showInfoField: true,
      infoFieldPlaceholder: 'Serial Number',
      showInfoField2: false,
      tableExtraColumn: true,
      extraColumnHeader: 'Serial',
      resultsHeader: 'SST Log',
    },
    logic: {
      showTuStep: true,
      requiresInfoField: true,
      extraInfoFieldKey: 'serialNumber',
      cqMessage: (your, their, arb) =>
        `CQ CQ SST ${your.callsign} ${your.callsign} K`,
      yourExchange: (your, their, arb) =>
        `${their.callsign} ${your.serialNumber} ${your.name} ${your.state}`,
      theirExchange: (your, their, arb) =>
        `R ${their.serialNumber} ${their.name} ${their.state}`,
      yourSignoff: (your, their, arb) => `TU ${arb}`,
      theirSignoff: (your, their, arb) => `TU`,
    },
  },

  hst: {
    ui: {
      showTuButton: false,
      showInfoField: false,
      showInfoField2: false,
      tableExtraColumn: false,
      resultsHeader: 'HST Championship',
    },
    logic: {
      showTuStep: false,
      cqMessage: (your, their, arb) => `${your.callsign}`,
      yourExchange: (your, their, arb) => `${their.callsign}`,
      theirExchange: (your, their, arb) => `R`,
      yourSignoff: (your, their, arb) => ``,
      theirSignoff: (your, their, arb) => ``,
    },
  },

  wpx: {
    ui: {
      showTuButton: true,
      showInfoField: true,
      infoFieldPlaceholder: 'Serial Number',
      showInfoField2: false,
      tableExtraColumn: true,
      extraColumnHeader: 'Serial',
      resultsHeader: 'WPX Contest Log',
    },
    logic: {
      showTuStep: true,
      requiresInfoField: true,
      extraInfoFieldKey: 'serialNumber',
      cqMessage: (your, their, arb) =>
        `CQ CQ WPX ${your.callsign} ${your.callsign} TEST`,
      yourExchange: (your, their, arb) =>
        `${their.callsign} 599 ${your.serialNumber}`,
      theirExchange: (your, their, arb) => `R 599 ${their.serialNumber}`,
      yourSignoff: (your, their, arb) => `TU`,
      theirSignoff: (your, their, arb) => `TU`,
    },
  },
};

// Функция извлечения префикса для WPX
export function extractPrefix(callsign) {
  const match = callsign.match(/^[A-Z0-9]+\d/);
  return match ? match[0] : callsign;
}

// Функция получения режима
export function getMode(modeName) {
  return modes[modeName] || modes.single;
}

// Экспорт списка режимов для UI
export function getModeList() {
  return Object.keys(modes).map((key) => ({
    id: key,
    name: modes[key].ui?.resultsHeader || key,
  }));
}

// Экспорт старых имён для обратной совместимости
export const modeLogicConfig = Object.fromEntries(
  Object.entries(modes).map(([key, value]) => [key, value.logic])
);

export const modeUIConfig = Object.fromEntries(
  Object.entries(modes).map(([key, value]) => [key, value.ui])
);
