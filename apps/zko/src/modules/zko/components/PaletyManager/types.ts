// Typy dla modułu zarządzania paletami

export interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: PaletaStatus;
  ilosc_formatek: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids: number[];
  typ?: TypPalety;
  created_at?: string;
  updated_at?: string;
  zko_id?: number;
  pozycja_id?: number;
  waga_kg?: number;
  objetosc_m3?: number;
  procent_wykorzystania?: number;
  wymaga_oklejania?: boolean;
}

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
  | 'pelna';

export type TypPalety = 'EURO' | 'STANDARD' | 'MAXI';

export type StrategiaPlanowania = 'kolor' | 'rozmiar' | 'mieszane' | 'oklejanie';

export interface PlanowaniePaletParams {
  max_wysokosc_mm: number;
  max_waga_kg: number;
  max_formatek_na_palete: number;
  grubosc_plyty: number;
  strategia: StrategiaPlanowania;
  typ_palety: TypPalety;
  uwzglednij_oklejanie: boolean;
}

export interface Formatka {
  id: number;
  nazwa_formatki: string;
  dlugosc: number;
  szerokosc: number;
  ilosc_planowana: number;
  ilosc_wykonana?: number;
  kolor_plyty: string;
  pozycja_id: number;
  paleta_id?: number;
  status?: string;
  wymaga_oklejania?: boolean;
  krawedzie_oklejane?: string; // np. "L,P,G,D" - lewa, prawa, góra, dół
}

export interface TransferFormatekParams {
  z_palety_id: number;
  na_palete_id: number;
  formatki_ids?: number[];
  ilosc_sztuk?: number;
  operator?: string;
  powod?: string;
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

export interface PlanPaletyzacji {
  paleta_nr: number;
  formatki: Formatka[];
  ilosc_formatek: number;
  wysokosc_stosu: number;
  kierunek: string;
  kolor: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
  wymaga_oklejania?: boolean;
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

// Limity systemowe
export const LIMITY_PALETY = {
  MAX_WYSOKOSC_MM: 1500,
  MIN_WYSOKOSC_MM: 400,
  DOMYSLNA_WYSOKOSC_MM: 1440,
  MAX_FORMATEK: 500,
  OPTYMALNE_FORMATEK_MIN: 150,
  OPTYMALNE_FORMATEK_MAX: 250,
  MAX_WAGA_KG: 1000,
  MIN_WAGA_KG: 100,
  DOMYSLNA_WAGA_KG: 700,
  GRUBOSC_PLYTY_DEFAULT: 18,
  WYMIARY_EURO: { dlugosc: 1200, szerokosc: 800 },
  WYMIARY_STANDARD: { dlugosc: 1200, szerokosc: 1000 },
  WYMIARY_MAXI: { dlugosc: 1200, szerokosc: 1200 }
} as const;

// Kolory statusów
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
  pelna: 'warning'
} as const;

// Komunikaty
export const MESSAGES = {
  PLAN_SUCCESS: 'Pomyślnie zaplanowano palety',
  PLAN_ERROR: 'Błąd podczas planowania palet',
  TRANSFER_SUCCESS: 'Przeniesiono formatki',
  TRANSFER_ERROR: 'Błąd przenoszenia formatek',
  CLOSE_SUCCESS: 'Paleta została zamknięta',
  CLOSE_ERROR: 'Błąd zamykania palety',
  NO_PALLETS: 'Brak palet do przeniesienia formatek',
  HEIGHT_EXCEEDED: 'Przekroczono maksymalną wysokość palety',
  WEIGHT_EXCEEDED: 'Przekroczono maksymalną wagę palety',
  WEIGHT_REQUIRED: 'Maksymalna waga jest wymagana'
} as const;

// Grubości płyt dostępne w systemie
export const GRUBOSCI_PLYT = [
  { value: 10, label: '10 mm' },
  { value: 12, label: '12 mm' },
  { value: 16, label: '16 mm' },
  { value: 18, label: '18 mm' },
  { value: 22, label: '22 mm' },
  { value: 25, label: '25 mm' },
  { value: 28, label: '28 mm' },
  { value: 36, label: '36 mm' }
] as const;