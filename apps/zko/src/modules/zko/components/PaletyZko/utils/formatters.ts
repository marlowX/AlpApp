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
export const formatujPrzeznaczenie = (przeznaczenie: PrzeznaczeniePalety): string => {
  const nazwy: Record<PrzeznaczeniePalety, string> = {
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
export const getIkonaPrzeznaczenia = (przeznaczenie: PrzeznaczeniePalety): string => {
  const ikony: Record<PrzeznaczeniePalety, string> = {
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
export const formatujStatus = (status: StatusPalety): string => {
  const nazwy: Record<StatusPalety, string> = {
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
export const getKolorStatusu = (status: StatusPalety): string => {
  const kolory: Record<StatusPalety, string> = {
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
 */
export const formatujWage = (waga: number | undefined): string => {
  if (waga === undefined || waga === null || waga === 0) return '0 kg';
  if (waga < 1) {
    return `${Math.round(waga * 1000)} g`;
  }
  return `${waga.toFixed(1)} kg`;
};

/**
 * Formatuje wysokość w mm
 */
export const formatujWysokosc = (wysokosc: number | undefined): string => {
  if (wysokosc === undefined || wysokosc === null || wysokosc === 0) return '0 mm';
  if (wysokosc >= 1000) {
    return `${(wysokosc / 1000).toFixed(2)} m`;
  }
  if (wysokosc >= 10) {
    return `${(wysokosc / 10).toFixed(1)} cm`;
  }
  return `${wysokosc} mm`;
};

/**
 * Formatuje wymiary formatki
 */
export const formatujWymiary = (x: number, y: number): string => {
  return `${x} × ${y} mm`;
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
  return `${Math.round(procent)}%`;
};

/**
 * Formatuje powierzchnię
 */
export const formatujPowierzchnie = (powierzchnia: number): string => {
  return `${powierzchnia.toFixed(2)} m²`;
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
export const formatujTypFormatki = (typ: string): string => {
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
  przeznaczenie: PrzeznaczeniePalety,
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
