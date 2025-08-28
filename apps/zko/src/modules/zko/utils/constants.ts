// Stałe używane w module ZKO

export const statusColors: Record<string, string> = {
  'nowe': 'blue',
  'CIECIE_START': 'orange',
  'OTWARCIE_PALETY': 'cyan',
  'PAKOWANIE_PALETY': 'cyan',
  'ZAMKNIECIE_PALETY': 'cyan',
  'CIECIE_STOP': 'orange',
  'BUFOR_PILA': 'gold',
  'TRANSPORT_1': 'purple',
  'BUFOR_OKLEINIARKA': 'gold',
  'OKLEJANIE_START': 'orange',
  'OKLEJANIE_STOP': 'orange',
  'TRANSPORT_2': 'purple',
  'BUFOR_WIERTARKA': 'gold',
  'WIERCENIE_START': 'orange',
  'WIERCENIE_STOP': 'orange',
  'TRANSPORT_3': 'purple',
  'BUFOR_KOMPLETOWANIE': 'gold',
  'KOMPLETOWANIE_START': 'lime',
  'KOMPLETOWANIE_STOP': 'lime',
  'BUFOR_PAKOWANIE': 'gold',
  'PAKOWANIE_START': 'lime',
  'PAKOWANIE_STOP': 'lime',
  'BUFOR_WYSYLKA': 'gold',
  'WYSYLKA': 'geekblue',
  'ZAKONCZONE': 'green',
  'ANULOWANE': 'red',
};

export const statusLabels: Record<string, string> = {
  'nowe': 'Nowe',
  'CIECIE_START': '🔪 Cięcie - Start',
  'OTWARCIE_PALETY': '📦 Otwarcie palety',
  'PAKOWANIE_PALETY': '📦 Pakowanie palety',
  'ZAMKNIECIE_PALETY': '📦 Zamknięcie palety',
  'CIECIE_STOP': '🔪 Cięcie - Stop',
  'BUFOR_PILA': '⏸️ Bufor piła',
  'TRANSPORT_1': '🚛 Transport 1',
  'BUFOR_OKLEINIARKA': '⏸️ Bufor okleiniarka',
  'OKLEJANIE_START': '🎨 Oklejanie - Start',
  'OKLEJANIE_STOP': '🎨 Oklejanie - Stop',
  'TRANSPORT_2': '🚛 Transport 2',
  'BUFOR_WIERTARKA': '⏸️ Bufor wiertarka',
  'WIERCENIE_START': '🔩 Wiercenie - Start',
  'WIERCENIE_STOP': '🔩 Wiercenie - Stop',
  'TRANSPORT_3': '🚛 Transport 3',
  'BUFOR_KOMPLETOWANIE': '⏸️ Bufor kompletowanie',
  'KOMPLETOWANIE_START': '📋 Kompletowanie - Start',
  'KOMPLETOWANIE_STOP': '📋 Kompletowanie - Stop',
  'BUFOR_PAKOWANIE': '⏸️ Bufor pakowanie',
  'PAKOWANIE_START': '📦 Pakowanie - Start',
  'PAKOWANIE_STOP': '📦 Pakowanie - Stop',
  'BUFOR_WYSYLKA': '⏸️ Bufor wysyłka',
  'WYSYLKA': '🚚 Wysyłka',
  'ZAKONCZONE': '✅ Zakończone',
  'ANULOWANE': '❌ Anulowane',
};

export const priorityColors: Record<number, string> = {
  1: '#52c41a', // Niski - zielony
  2: '#52c41a',
  3: '#1890ff', // Normalny - niebieski
  4: '#1890ff',
  5: '#1890ff',
  6: '#faad14', // Średni - żółty
  7: '#faad14',
  8: '#ff4d4f', // Wysoki - czerwony
  9: '#ff4d4f',
  10: '#cf1322', // Krytyczny - ciemnoczerwony
};

export const priorityLabels: Record<number, string> = {
  1: 'Bardzo niski',
  2: 'Niski',
  3: 'Normalny -',
  4: 'Normalny',
  5: 'Normalny +',
  6: 'Średni',
  7: 'Podwyższony',
  8: 'Wysoki',
  9: 'Bardzo wysoki',
  10: 'Krytyczny',
};

export const workflowGroups = {
  PRODUKCJA: [
    'CIECIE_START',
    'OTWARCIE_PALETY', 
    'PAKOWANIE_PALETY',
    'ZAMKNIECIE_PALETY',
    'CIECIE_STOP',
  ],
  BUFORY: [
    'BUFOR_PILA',
    'BUFOR_OKLEINIARKA',
    'BUFOR_WIERTARKA',
    'BUFOR_KOMPLETOWANIE',
    'BUFOR_PAKOWANIE',
    'BUFOR_WYSYLKA',
  ],
  TRANSPORT: [
    'TRANSPORT_1',
    'TRANSPORT_2',
    'TRANSPORT_3',
  ],
  OKLEJANIE: [
    'OKLEJANIE_START',
    'OKLEJANIE_STOP',
  ],
  WIERCENIE: [
    'WIERCENIE_START',
    'WIERCENIE_STOP',
  ],
  KOMPLETOWANIE: [
    'KOMPLETOWANIE_START',
    'KOMPLETOWANIE_STOP',
  ],
  PAKOWANIE_FINALNE: [
    'PAKOWANIE_START',
    'PAKOWANIE_STOP',
  ],
  FINALIZACJA: [
    'WYSYLKA',
    'ZAKONCZONE',
    'ANULOWANE',
  ],
};

export const damageTypes = [
  { value: 'pekniecie', label: 'Pęknięcie' },
  { value: 'zarysowanie', label: 'Zarysowanie' },
  { value: 'odprysk', label: 'Odprysk' },
  { value: 'zle_wymiary', label: 'Złe wymiary' },
  { value: 'zle_wiercenie', label: 'Złe wiercenie' },
  { value: 'uszkodzenie_krawedzi', label: 'Uszkodzenie krawędzi' },
  { value: 'zle_oklejenie', label: 'Złe oklejenie' },
  { value: 'inne', label: 'Inne' },
];

export const paletTypes = [
  { value: 'EURO', label: 'Europaleta' },
  { value: 'POLPALETA', label: 'Półpaleta' },
  { value: 'INNA', label: 'Inna' },
];

export const defaultPalletLimits = {
  maxHeight: 180, // cm
  maxWeight: 700, // kg
  defaultThickness: 18, // mm
};
