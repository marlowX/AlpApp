/**
 * @fileoverview Definicje typów dla modułu PaletyZko
 * @module PaletyZko/types
 */

// ==================== STAŁE ====================
export const LIMITY_PALETY = {
  MAX_WAGA_KG: 700,
  MAX_WYSOKOSC_MM: 1440,
  GRUBOSC_PLYTY_MM: 18,
  FORMATEK_NA_POZIOM: 4,
  PALETA_SZERKOSC_MM: 1200,
  PALETA_DLUGOSC_MM: 800
} as const;

export const PRZEZNACZENIE_PALETY = {
  MAGAZYN: 'MAGAZYN',
  OKLEINIARKA: 'OKLEINIARKA',
  WIERCENIE: 'WIERCENIE',
  CIECIE: 'CIECIE',
  WYSYLKA: 'WYSYLKA'
} as const;

export const STATUS_PALETY = {
  PRZYGOTOWANIE: 'przygotowanie',
  GOTOWA: 'gotowa',
  W_TRANSPORCIE: 'w_transporcie',
  DOSTARCZONA: 'dostarczona',
  ZAMKNIETA: 'zamknieta'
} as const;

// ==================== TYPY ====================

export type PrzeznaczeniePalety = keyof typeof PRZEZNACZENIE_PALETY;
export type StatusPalety = typeof STATUS_PALETY[keyof typeof STATUS_PALETY];

export interface Formatka {
  id: number;
  pozycja_id: number;
  wymiar_x: number;
  wymiar_y: number;
  ilosc_szt: number;
  ilosc_dostepna: number;
  typ: string;
  kolor?: string;
  grubosc?: number;
  waga_sztuki?: number;
  nazwa_plyty?: string;
  numer_formatki?: string;
}

export interface FormatkaZIloscia extends Formatka {
  ilosc_na_palecie: number;
}

export interface Paleta {
  id: number;
  zko_id: number;
  pozycja_id?: number;
  numer_palety: string;
  typ_palety: string;
  przeznaczenie: PrzeznaczeniePalety;
  status: StatusPalety;
  formatki_ids?: number[];
  ilosc_formatek: number;
  wysokosc_stosu: number;
  waga_kg: number;
  max_waga_kg: number;
  max_wysokosc_mm: number;
  kolory_na_palecie?: string;
  powierzchnia_m2?: number;
  lokalizacja_aktualna?: string;
  uwagi?: string;
  utworzyl?: string;
  data_pakowania?: string;
  created_at?: string;
  updated_at?: string;
  formatki_szczegoly?: FormatkaZIloscia[];
}

export interface PaletaFormData {
  przeznaczenie: PrzeznaczeniePalety;
  max_waga_kg?: number;
  max_wysokosc_mm?: number;
  uwagi?: string;
  formatki: Array<{
    formatka_id: number;
    ilosc: number;
  }>;
}

export interface PozycjaZKO {
  id: number;
  zko_id: number;
  rozkroj_id: number;
  ilosc_plyt: number;
  kolor_plyty: string;
  nazwa_plyty: string;
  kolejnosc?: number;
  uwagi?: string;
  status?: string;
  formatki?: Formatka[];
}

export interface PodsumowaniePalet {
  liczba_palet: number;
  sztuk_total: number;
  waga_total: number;
  wysokosc_avg: number;
  procent_wykorzystania_wagi: number;
  procent_wykorzystania_wysokosci: number;
  po_przeznaczeniu: {
    [key in PrzeznaczeniePalety]?: {
      liczba_palet: number;
      sztuk: number;
      waga: number;
    };
  };
}

export interface DragDropItem {
  type: 'formatka';
  formatka: Formatka;
  sourcePaletaId?: number;
  ilosc: number;
}

export interface PaletaStats {
  waga_aktualna: number;
  wysokosc_aktualna: number;
  procent_wagi: number;
  procent_wysokosci: number;
  liczba_poziomow: number;
  liczba_formatek: number;
  kolory: string[];
}

export interface ApiResponse<T = any> {
  sukces: boolean;
  data?: T;
  komunikat?: string;
  error?: string;
}
