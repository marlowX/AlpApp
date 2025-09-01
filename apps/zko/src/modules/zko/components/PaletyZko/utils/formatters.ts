/**
 * @fileoverview Funkcje formatujące dla modułu PaletyZko
 * @module PaletyZko/utils/formatters
 */

import { PrzeznaczeniePalety, StatusPalety, PRZEZNACZENIE_PALETY, STATUS_PALETY } from '../types';

/**
 * Formatuje numer palety
 */
export const formatujNumerPalety = (numer: string): string => {
  if (!numer) return 'Brak numeru';
  // Jeśli numer jest krótki, dodaj prefix
  if (numer.length < 10) {
    return `PAL-${numer}`;
  }
  return numer;
};

/**
 * Formatuje datę do wyświetlenia
 */
export const formatujDate = (date: string | Date | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatuje przeznaczenie palety do wyświetlenia
 */
export const formatujPrzeznaczenie = (przeznaczenie: PrzeznaczeniePalety | string): string => {
  const nazwy: Record<string, string> = {
    MAGAZYN: 'Magazyn',
    OKLEINIARKA: 'Okleiniarka',
    WIERCENIE: 'Wiercenie CNC',
    CIECIE: 'Cięcie',
    WYSYLKA: 'Wysyłka'
  };
  return nazwy[przeznaczenie] || przeznaczenie;
};

/**
 * Zwraca ikonę dla przeznaczenia
 */
export const getIkonaPrzeznaczenia = (przeznaczenie: PrzeznaczeniePalety | string): string => {
  const ikony: Record<string, string> = {
    MAGAZYN: '📦',
    OKLEINIARKA: '🎨',
    WIERCENIE: '🔧',
    CIECIE: '✂️',
    WYSYLKA: '🚚'
  };
  return ikony[przeznaczenie] || '📦';
};

/**
 * Formatuje status palety
 */
export const formatujStatus = (status: StatusPalety | string): string => {
  const nazwy: Record<string, string> = {
    przygotowanie: 'W przygotowaniu',
    gotowa: 'Gotowa',
    w_transporcie: 'W transporcie',
    dostarczona: 'Dostarczona', 
    zamknieta: 'Zamknięta'
  };
  return nazwy[status] || status;
};

/**
 * Zwraca kolor dla statusu
 */
export const getKolorStatusu = (status: StatusPalety | string): string => {
  const kolory: Record<string, string> = {
    przygotowanie: 'orange',
    gotowa: 'green',
    w_transporcie: 'blue',
    dostarczona: 'purple',
    zamknieta: 'gray'
  };
  return kolory[status] || 'default';
};

/**
 * Formatuje wagę w kg
 * NAPRAWIONE: Bezpieczna konwersja do liczby
 */
export const formatujWage = (waga: any): string => {
  // Bezpieczna konwersja do liczby
  const wagaNum = parseFloat(waga);
  
  // Sprawdź czy konwersja się udała
  if (isNaN(wagaNum) || wagaNum === null || wagaNum === undefined) {
    return '0 kg';
  }
  
  // Dla bardzo małych wag, pokaż w gramach
  if (wagaNum > 0 && wagaNum < 1) {
    return `${Math.round(wagaNum * 1000)} g`;
  }
  
  // Standardowe formatowanie w kg
  return `${wagaNum.toFixed(1)} kg`;
};

/**
 * Formatuje wysokość w mm
 * NAPRAWIONE: Bezpieczna konwersja do liczby
 */
export const formatujWysokosc = (wysokosc: any): string => {
  // Bezpieczna konwersja do liczby
  const wysokoscNum = parseFloat(wysokosc);
  
  // Sprawdź czy konwersja się udała
  if (isNaN(wysokoscNum) || wysokoscNum === null || wysokoscNum === undefined) {
    return '0 mm';
  }
  
  // Dla dużych wysokości, pokaż w metrach
  if (wysokoscNum >= 1000) {
    return `${(wysokoscNum / 1000).toFixed(2)} m`;
  }
  
  // Dla średnich wysokości, pokaż w centymetrach
  if (wysokoscNum >= 100) {
    return `${(wysokoscNum / 10).toFixed(1)} cm`;
  }
  
  // Standardowe formatowanie w mm
  return `${Math.round(wysokoscNum)} mm`;
};

/**
 * Formatuje wymiary formatki
 */
export const formatujWymiary = (x: number | undefined, y: number | undefined): string => {
  const xVal = x || 0;
  const yVal = y || 0;
  return `${xVal} × ${yVal} mm`;
};

/**
 * Formatuje kolor płyty do wyświetlenia
 */
export const formatujKolor = (kolor: string | undefined): string => {
  if (!kolor) return 'Brak koloru';
  
  // Mapowanie popularnych kodów kolorów
  const mapaKolorow: Record<string, string> = {
    'BIA': 'Biały',
    'CZA': 'Czarny',
    'SZA': 'Szary',
    'BEZ': 'Beżowy',
    'BRA': 'Brązowy',
    'BIAL': 'Biały',
    'CZAR': 'Czarny',
    'SZAR': 'Szary',
    'BEZOW': 'Beżowy',
    'BRAZOW': 'Brązowy',
    'WHITE': 'Biały',
    'BLACK': 'Czarny',
    'GRAY': 'Szary',
    'GREY': 'Szary'
  };
  
  const upper = kolor.toUpperCase();
  return mapaKolorow[upper] || kolor;
};

/**
 * Zwraca kolor HEX dla koloru płyty
 */
export const getKolorHex = (kolor: string | undefined): string => {
  if (!kolor) return '#e0e0e0';
  
  const mapaHex: Record<string, string> = {
    'BIA': '#ffffff',
    'BIAL': '#ffffff',
    'WHITE': '#ffffff',
    'CZA': '#2c2c2c',
    'CZAR': '#2c2c2c',
    'BLACK': '#2c2c2c',
    'SZA': '#808080',
    'SZAR': '#808080',
    'GRAY': '#808080',
    'GREY': '#808080',
    'BEZ': '#f5deb3',
    'BEZOW': '#f5deb3',
    'BRA': '#8b4513',
    'BRAZOW': '#8b4513',
    'CZER': '#dc143c',
    'CZERW': '#dc143c',
    'ZIEL': '#228b22',
    'NIEBI': '#4169e1',
    'ZOL': '#ffd700',
    'ZOLT': '#ffd700'
  };
  
  const upper = kolor.toUpperCase();
  for (const [key, hex] of Object.entries(mapaHex)) {
    if (upper.includes(key)) {
      return hex;
    }
  }
  
  // Domyślny kolor
  return '#e0e0e0';
};

/**
 * Formatuje procent do wyświetlenia
 */
export const formatujProcent = (procent: number): string => {
  const procentNum = parseFloat(String(procent));
  if (isNaN(procentNum)) return '0%';
  return `${Math.round(procentNum)}%`;
};

/**
 * Formatuje powierzchnię
 */
export const formatujPowierzchnie = (powierzchnia: number | undefined): string => {
  const powierzchniaNum = parseFloat(String(powierzchnia || 0));
  if (isNaN(powierzchniaNum)) return '0.00 m²';
  return `${powierzchniaNum.toFixed(2)} m²`;
};

/**
 * Formatuje listę kolorów
 */
export const formatujListeKolorow = (kolory: string[]): string => {
  if (!kolory || kolory.length === 0) return 'Brak kolorów';
  return kolory.map(k => formatujKolor(k)).join(', ');
};

/**
 * Skraca tekst do określonej długości
 */
export const skrocTekst = (tekst: string | undefined, maxDlugosc: number = 50): string => {
  if (!tekst) return '';
  if (tekst.length <= maxDlugosc) return tekst;
  return tekst.substring(0, maxDlugosc - 3) + '...';
};

/**
 * Formatuje typ formatki
 */
export const formatujTypFormatki = (typ: string | undefined): string => {
  if (!typ) return 'formatka';
  
  const typy: Record<string, string> = {
    'formatka': 'Formatka',
    'pasek': 'Pasek',
    'odpad': 'Odpad',
    'element': 'Element'
  };
  return typy[typ.toLowerCase()] || typ;
};

/**
 * Generuje etykietę dla palety
 */
export const generujEtykietePalety = (
  numerPalety: string,
  przeznaczenie: PrzeznaczeniePalety | string,
  liczbaFormatek: number
): string => {
  return `${formatujNumerPalety(numerPalety)} | ${formatujPrzeznaczenie(przeznaczenie)} | ${liczbaFormatek} szt.`;
};

/**
 * Formatuje czas trwania
 */
export const formatujCzasTrwania = (start: Date, koniec?: Date): string => {
  const end = koniec || new Date();
  const roznica = end.getTime() - start.getTime();
  
  const dni = Math.floor(roznica / (1000 * 60 * 60 * 24));
  const godziny = Math.floor((roznica % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minuty = Math.floor((roznica % (1000 * 60 * 60)) / (1000 * 60));
  
  if (dni > 0) {
    return `${dni} dni ${godziny} godz.`;
  } else if (godziny > 0) {
    return `${godziny} godz. ${minuty} min.`;
  }
  return `${minuty} min.`;
};
