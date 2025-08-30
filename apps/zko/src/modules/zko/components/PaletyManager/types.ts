// Typy dla modułu zarządzania paletami V5

export interface Paleta {
  id: number | string;
  numer_palety?: string;
  numer?: string;
  kierunek?: string;
  status?: PaletaStatus;
  ilosc_formatek?: number;
  wysokosc_stosu?: number;
  kolory_na_palecie?: string;
  formatki_ids?: number[];
  formatki?: PaletaFormatka[];
  typ?: TypPalety;
  created_at?: string;
  updated_at?: string;
  zko_id?: number;
  pozycja_id?: number;
  waga_kg?: number;
  objetosc_m3?: number;
  procent_wykorzystania?: number;
  wymaga_oklejania?: boolean;
  powierzchnia_m2?: number;
  ilosc_plyt_ekwiwalent?: number;
  operator_pakujacy?: string;
  lokalizacja_aktualna?: string;
  data_pakowania?: string;
  data_wysylki?: string;
  etykieta_qr?: string;
  przeznaczenie?: string;
  uwagi?: string;
  max_waga?: number;
  max_wysokosc?: number;
  operator?: string;
}

export interface PaletaFormatka {
  formatka_id: number;
  ilosc: number;
}

export interface PaletaStats {
  waga: number;
  sztuk: number;
  wysokosc: number;
  kolory: string[];
  wykorzystanieWagi: number;
  wykorzystanieWysokosci: number;
}

// Dodane eksporty dla komponentów
export const PALLET_DESTINATIONS = {
  MAGAZYN: { label: 'Magazyn', icon: '📦', color: 'blue' },
  OKLEINIARKA: { label: 'Okleiniarka', icon: '🎨', color: 'orange' },
  WIERCENIE: { label: 'Wiercenie', icon: '🔧', color: 'purple' },
  CIECIE: { label: 'Cięcie', icon: '✂️', color: 'red' },
  WYSYLKA: { label: 'Wysyłka', icon: '🚚', color: 'green' }
};

export type PaletaStatus = 
  | 'otwarta'
  | 'zamknieta'
  | 'wyslana'
  | 'dostarczona'
  | 'przygotowanie'
  | 'pakowanie'
  | 'zapakowana'
  | 'pusta'
  | 'w_trakcie_pakowania'
  | 'pelna'
  | 'gotowa_do_transportu'
  | 'w_transporcie';

export type TypPalety = 'EURO' | 'STANDARD' | 'MAXI' | 'JEDNORAZOWA';

// NOWE STRATEGIE V5
export type StrategiaPlanowania = 
  | 'inteligentna'    // Kombinacja wszystkich strategii
  | 'kolor'           // Grupowanie tylko po kolorze
  | 'rozmiar'         // Sortowanie po rozmiarze (duże na dół)
  | 'oklejanie'       // Priorytet dla formatek wymagających oklejania
  | 'mieszane'        // Mieszane podejście
  | 'optymalizacja';  // Maksymalne wykorzystanie przestrzeni

export interface PlanowaniePaletParams {
  strategia: StrategiaPlanowania;
  max_wysokosc_mm: number;
  max_waga_kg: number;
  max_formatek_na_palete: number;
  grubosc_plyty: number;
  typ_palety: TypPalety;
  uwzglednij_oklejanie: boolean;
  nadpisz_istniejace?: boolean;
  operator?: string;
}

export interface Formatka {
  id: number;
  nazwa?: string;
  nazwa_formatki?: string;
  pozycja_id?: number;
  dlugosc: number;
  szerokosc: number;
  grubosc?: number;
  ilosc_planowana: number;
  ilosc_wykonana?: number;
  ilosc_dostepna?: number;
  kolor?: string;
  kolor_plyty?: string;
  paleta_id?: number;
  status?: string;
  wymaga_oklejania?: boolean;
  krawedzie_oklejane?: string; // np. "L,P,G,D" - lewa, prawa, góra, dół
  powierzchnia_m2?: number;
  waga_kg?: number;
  waga_sztuka?: number;
  wysokosc_mm?: number;
}

// NOWE INTERFEJSY V5
export interface PlanPaletyzacjiV5 {
  sukces: boolean;
  komunikat: string;
  palety_utworzone: number[];
  plan_szczegolowy: PlanPaletyDetale[];
  statystyki: StatystykiPlanowania;
}

export interface PlanPaletyDetale {
  paleta_nr: number;
  formatki: Formatka[];
  ilosc_formatek: number;
  wysokosc_stosu_mm: number;
  waga_kg: number;
  kolory: string;
  kierunek: string;
  typ_palety: TypPalety;
  procent_wykorzystania: number;
  wymaga_oklejania: boolean;
}

export interface StatystykiPlanowania {
  palety_utworzone: number;
  formatki_rozplanowane: number;
  pozycje_przetworzone: number;
  strategia_uzyta: StrategiaPlanowania;
  srednie_wykorzystanie: number;
  istniejace_palety?: number;
  czas_planowania_ms?: number;
}

export interface UsuwaniePaletParams {
  palety_ids?: number[];
  tylko_puste: boolean;
  force_usun: boolean;
  operator?: string;
}

export interface UsuwaniePaletResult {
  sukces: boolean;
  komunikat: string;
  usuniete_palety: number[];
  przeniesione_formatki: number;
  ostrzezenia: string[];
}

export interface ReorganizacjaPaletParams {
  strategia: 'optymalizacja' | 'kolor' | 'rozmiar';
  operator?: string;
}

export interface ReorganizacjaPaletResult {
  sukces: boolean;
  komunikat: string;
  przed_reorganizacja: StatystykiPalet;
  po_reorganizacji: StatystykiPalet;
}

export interface StatystykiPalet {
  liczba_palet: number;
  formatki_total: number;
  srednie_wykorzystanie: number;
  puste_palety: number;
  palety_pelne: number;
  najwyzsze_wykorzystanie: number;
  najnizsze_wykorzystanie: number;
}

export interface TransferFormatekParams {
  z_palety_id: number;
  na_palete_id: number;
  formatki_ids?: number[];
  ilosc_sztuk?: number;
  operator?: string;
  powod?: string;
}

export interface TransferFormatekResult {
  sukces: boolean;
  komunikat: string;
  z_palety_info: Paleta;
  na_palete_info: Paleta;
  przeniesione_formatki: number;
}

export interface PaletaHistoria {
  id: number;
  paleta_id: number;
  akcja: string;
  opis: string;
  operator: string;
  data_akcji: string;
  dodatkowe?: any;
}

export interface TransportInfo {
  id: number;
  palety_ids: number[];
  kierunek: 'wewnetrzny' | 'zewnetrzny' | 'klient' | 'magazyn';
  typ_transportu: 'WEWNETRZNY' | 'ZEWNETRZNY' | 'KURIERSKI';
  przewoznik?: string;
  kierowca?: string;
  nr_rejestracyjny?: string;
  dokument_wz?: string;
  data_wysylki?: string;
  data_dostawy?: string;
  uwagi?: string;
}

export interface BuforOkleiniarka {
  numer_miejsca: string;
  sektor: string;
  status: 'wolne' | 'zajete' | 'rezerwowane';
  paleta_numer?: string;
  paleta_id?: number;
  kolory?: string;
  ilosc_sztuk?: number;
  czas_oczekiwania?: string;
  priorytet: number;
  planowana_data_oklejania?: string;
}

// ULEPSZONE LIMITY V5
export const LIMITY_PALETY = {
  // Wysokość
  MAX_WYSOKOSC_MM: 1600,
  MIN_WYSOKOSC_MM: 400,
  DOMYSLNA_WYSOKOSC_MM: 1440,
  OPTYMALNA_WYSOKOSC_MM: 1200,
  
  // Formatki
  MAX_FORMATEK: 500,
  OPTYMALNE_FORMATEK_MIN: 150,
  OPTYMALNE_FORMATEK_MAX: 250,
  DOMYSLNE_FORMATEK: 200,
  
  // Waga
  MAX_WAGA_KG: 1000,
  MIN_WAGA_KG: 100,
  DOMYSLNA_WAGA_KG: 700,
  OPTYMALNA_WAGA_KG: 600,
  
  // Płyty
  GRUBOSC_PLYTY_DEFAULT: 18,
  MIN_GRUBOSC: 10,
  MAX_GRUBOSC: 36,
  
  // Wymiary palet (mm)
  WYMIARY_EURO: { dlugosc: 1200, szerokosc: 800, wysokosc_max: 1440 },
  WYMIARY_STANDARD: { dlugosc: 1200, szerokosc: 1000, wysokosc_max: 1600 },
  WYMIARY_MAXI: { dlugosc: 1200, szerokosc: 1200, wysokosc_max: 1800 },
  
  // Wykorzystanie
  MIN_WYKORZYSTANIE_PROCENT: 70,
  OPTYMALNE_WYKORZYSTANIE_PROCENT: 85,
  MAX_WYKORZYSTANIE_PROCENT: 95,
  
  // Gęstość materiałów (kg/m³)
  GESTOSC_PLYTY_KG_M3: 700,
  WAGA_M2_18MM: 12.6 // kg/m² dla płyty 18mm
} as const;

// ULEPSZONE KOLORY STATUSÓW
export const STATUS_COLORS = {
  otwarta: 'processing',
  zamknieta: 'success',
  wyslana: 'warning',
  dostarczona: 'success',
  przygotowanie: 'default',
  pakowanie: 'processing',
  zapakowana: 'success',
  pusta: 'default',
  w_trakcie_pakowania: 'processing',
  pelna: 'warning',
  gotowa_do_transportu: 'success',
  w_transporcie: 'processing'
} as const;

// NOWE KOMUNIKATY V5
export const MESSAGES = {
  // Planowanie
  PLAN_SUCCESS: 'Pomyślnie zaplanowano palety',
  PLAN_ERROR: 'Błąd podczas planowania palet',
  PLAN_V5_SUCCESS: 'Planowanie V5 zakończone pomyślnie',
  PLAN_EXISTS: 'Palety już istnieją dla tego ZKO',
  
  // Transfer
  TRANSFER_SUCCESS: 'Przeniesiono formatki',
  TRANSFER_ERROR: 'Błąd przenoszenia formatek',
  TRANSFER_NO_SPACE: 'Brak miejsca na palecie docelowej',
  TRANSFER_INVALID_STATUS: 'Paleta ma nieprawidłowy status do transferu',
  
  // Zamykanie
  CLOSE_SUCCESS: 'Paleta została zamknięta',
  CLOSE_ERROR: 'Błąd zamykania palety',
  CLOSE_ALREADY_CLOSED: 'Paleta jest już zamknięta',
  
  // Usuwanie
  DELETE_SUCCESS: 'Usunięto palety',
  DELETE_ERROR: 'Błąd usuwania palet',
  DELETE_EMPTY_SUCCESS: 'Usunięto puste palety',
  DELETE_WITH_TRANSFER: 'Usunięto palety z przeniesieniem formatek',
  
  // Reorganizacja
  REORGANIZE_SUCCESS: 'Reorganizacja palet zakończona',
  REORGANIZE_ERROR: 'Błąd reorganizacji palet',
  
  // Ogólne
  NO_PALLETS: 'Brak palet do operacji',
  HEIGHT_EXCEEDED: 'Przekroczono maksymalną wysokość palety',
  WEIGHT_EXCEEDED: 'Przekroczono maksymalną wagę palety',
  WEIGHT_REQUIRED: 'Maksymalna waga jest wymagana',
  INVALID_ZKO: 'Nieprawidłowe ID ZKO',
  
  // Walidacja
  VALIDATION_ERROR: 'Błąd walidacji danych',
  INVALID_STRATEGY: 'Nieprawidłowa strategia planowania',
  INVALID_PALLET_TYPE: 'Nieprawidłowy typ palety'
} as const;

// STRATEGIE PLANOWANIA - opisy
export const STRATEGIE_DESCRIPTIONS = {
  inteligentna: {
    name: 'Inteligentna (zalecana)',
    description: 'Kombinuje wszystkie kryteria: kolor, oklejanie, rozmiar i wykorzystanie przestrzeni',
    icon: '🤖',
    color: 'blue'
  },
  kolor: {
    name: 'Grupowanie po kolorze',
    description: 'Formatki tego samego koloru na jednej palecie',
    icon: '🎨',
    color: 'purple'
  },
  rozmiar: {
    name: 'Sortowanie po rozmiarze',
    description: 'Duże formatki na dół, małe na górę',
    icon: '📏',
    color: 'green'
  },
  oklejanie: {
    name: 'Priorytet oklejania',
    description: 'Formatki wymagające oklejania mają priorytet',
    icon: '✨',
    color: 'gold'
  },
  optymalizacja: {
    name: 'Maksymalne wykorzystanie',
    description: 'Najlepsze wypełnienie przestrzeni palety',
    icon: '📦',
    color: 'orange'
  },
  mieszane: {
    name: 'Mieszane',
    description: 'Różne kolory i rozmiary na jednej palecie',
    icon: '🔀',
    color: 'cyan'
  }
} as const;

// Grubości płyt dostępne w systemie
export const GRUBOSCI_PLYT = [
  { value: 10, label: '10 mm', waga_m2: 7.0 },
  { value: 12, label: '12 mm', waga_m2: 8.4 },
  { value: 16, label: '16 mm', waga_m2: 11.2 },
  { value: 18, label: '18 mm', waga_m2: 12.6 },
  { value: 22, label: '22 mm', waga_m2: 15.4 },
  { value: 25, label: '25 mm', waga_m2: 17.5 },
  { value: 28, label: '28 mm', waga_m2: 19.6 },
  { value: 36, label: '36 mm', waga_m2: 25.2 }
] as const;

// NOWE TYPY V5
export interface SmartDeleteParams {
  zko_id: number;
  palety_ids?: number[];
  tylko_puste: boolean;
  force_usun: boolean;
  operator?: string;
}

export interface SmartDeleteResult {
  sukces: boolean;
  komunikat: string;
  usuniete_palety: number[];
  przeniesione_formatki: number;
  ostrzezenia: string[];
}

export interface PaletaValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canTransfer: boolean;
  canClose: boolean;
  canDelete: boolean;
}

export interface OptimalizacjaResult {
  przed: StatystykiPalet;
  po: StatystykiPalet;
  zyskano_miejsce: number;
  usunieto_palet: number;
  przeniesiono_formatek: number;
}

// UTILITY FUNCTIONS
export const validatePaletaParams = (params: PlanowaniePaletParams): PaletaValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Sprawdź wysokość
  if (params.max_wysokosc_mm < LIMITY_PALETY.MIN_WYSOKOSC_MM) {
    errors.push(`Minimalna wysokość to ${LIMITY_PALETY.MIN_WYSOKOSC_MM}mm`);
  }
  if (params.max_wysokosc_mm > LIMITY_PALETY.MAX_WYSOKOSC_MM) {
    warnings.push(`Wysokość powyżej ${LIMITY_PALETY.MAX_WYSOKOSC_MM}mm może być problematyczna`);
  }
  
  // Sprawdź wagę
  if (params.max_waga_kg < LIMITY_PALETY.MIN_WAGA_KG) {
    errors.push(`Minimalna waga to ${LIMITY_PALETY.MIN_WAGA_KG}kg`);
  }
  if (params.max_waga_kg > LIMITY_PALETY.MAX_WAGA_KG) {
    warnings.push(`Waga powyżej ${LIMITY_PALETY.MAX_WAGA_KG}kg może być problematyczna`);
  }
  
  // Sprawdź formatki
  if (params.max_formatek_na_palete > LIMITY_PALETY.MAX_FORMATEK) {
    warnings.push(`Więcej niż ${LIMITY_PALETY.MAX_FORMATEK} formatek może być trudne w obsłudze`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canTransfer: errors.length === 0,
    canClose: errors.length === 0,
    canDelete: true
  };
};

export const calculatePaletaUtilization = (paleta: Paleta): number => {
  if (!paleta.wysokosc_stosu || !paleta.typ) {
    return 0;
  }
  
  const maxHeight = paleta.typ === 'EURO' 
    ? LIMITY_PALETY.WYMIARY_EURO.wysokosc_max
    : LIMITY_PALETY.WYMIARY_STANDARD.wysokosc_max;
    
  return Math.round((paleta.wysokosc_stosu / maxHeight) * 100);
};

export const getPaletaStatusColor = (status: PaletaStatus): string => {
  return STATUS_COLORS[status] || 'default';
};

export const getStrategiaInfo = (strategia: StrategiaPlanowania) => {
  return STRATEGIE_DESCRIPTIONS[strategia] || {
    name: strategia,
    description: 'Nieznana strategia',
    icon: '❓',
    color: 'default'
  };
};

// NOWE HOOKI V5
export interface UsePaletyManagerResult {
  palety: Paleta[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  planuj: (params: PlanowaniePaletParams) => Promise<PlanPaletyzacjiV5>;
  usun: (params: SmartDeleteParams) => Promise<SmartDeleteResult>;
  reorganizuj: (params: ReorganizacjaPaletParams) => Promise<ReorganizacjaPaletResult>;
  przenies: (params: TransferFormatekParams) => Promise<TransferFormatekResult>;
  zamknij: (paletaId: number, operator?: string, uwagi?: string) => Promise<void>;
  statystyki: StatystykiPalet | null;
}

// PRESETS DLA RÓŻNYCH TYPÓW PRODUKCJI
export const PLANOWANIE_PRESETS = {
  standardowe: {
    name: 'Standardowe',
    params: {
      strategia: 'inteligentna' as StrategiaPlanowania,
      max_wysokosc_mm: 1440,
      max_waga_kg: 700,
      max_formatek_na_palete: 200,
      grubosc_plyty: 18,
      typ_palety: 'EURO' as TypPalety,
      uwzglednij_oklejanie: true
    }
  },
  wytrzymale: {
    name: 'Wytrzymałe (więcej wagi)',
    params: {
      strategia: 'optymalizacja' as StrategiaPlanowania,
      max_wysokosc_mm: 1200,
      max_waga_kg: 900,
      max_formatek_na_palete: 150,
      grubosc_plyty: 22,
      typ_palety: 'EURO' as TypPalety,
      uwzglednij_oklejanie: true
    }
  },
  oklejanie: {
    name: 'Oklejanie (specjalne)',
    params: {
      strategia: 'oklejanie' as StrategiaPlanowania,
      max_wysokosc_mm: 1000,
      max_waga_kg: 500,
      max_formatek_na_palete: 100,
      grubosc_plyty: 18,
      typ_palety: 'EURO' as TypPalety,
      uwzglednij_oklejanie: true
    }
  },
  transport: {
    name: 'Transport (optymalne)',
    params: {
      strategia: 'kolor' as StrategiaPlanowania,
      max_wysokosc_mm: 1400,
      max_waga_kg: 650,
      max_formatek_na_palete: 180,
      grubosc_plyty: 18,
      typ_palety: 'EURO' as TypPalety,
      uwzglednij_oklejanie: false
    }
  }
} as const;

export type PlanowaniePreset = keyof typeof PLANOWANIE_PRESETS;
