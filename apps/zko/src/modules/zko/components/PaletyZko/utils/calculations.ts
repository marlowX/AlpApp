/**
 * @fileoverview Funkcje obliczeniowe dla modułu PaletyZko
 * @module PaletyZko/utils/calculations
 */

import { LIMITY_PALETY, Formatka, FormatkaZIloscia, PaletaStats } from '../types';

/**
 * Oblicza wagę formatek
 */
export const obliczWageFormatek = (formatki: FormatkaZIloscia[]): number => {
  return formatki.reduce((suma, f) => {
    const wagaSztuki = f.waga_sztuki || obliczWageSztuki(f);
    return suma + (wagaSztuki * f.ilosc_na_palecie);
  }, 0);
};

/**
 * Oblicza wagę pojedynczej sztuki formatki
 */
export const obliczWageSztuki = (formatka: Formatka): number => {
  // Jeśli mamy wagę sztuki, użyj jej
  if (formatka.waga_sztuki && formatka.waga_sztuki > 0) {
    return formatka.waga_sztuki;
  }
  
  // Oblicz na podstawie wymiarów
  const powierzchnia = (formatka.wymiar_x * formatka.wymiar_y) / 1000000; // m²
  const grubosc = (formatka.grubosc || LIMITY_PALETY.GRUBOSC_PLYTY_MM) / 1000; // m
  const objetosc = powierzchnia * grubosc; // m³
  const gestosc = 650; // kg/m³ dla płyty wiórowej
  
  return objetosc * gestosc;
};

/**
 * Oblicza wysokość stosu formatek
 * WAŻNE: Formatki układane są OBOK SIEBIE na poziomach, nie jedna na drugiej!
 */
export const obliczWysokoscStosu = (formatki: FormatkaZIloscia[]): number => {
  const liczbaFormatek = formatki.reduce((sum, f) => sum + f.ilosc_na_palecie, 0);
  const liczbaPoziomow = Math.ceil(liczbaFormatek / LIMITY_PALETY.FORMATEK_NA_POZIOM);
  const grubosc = formatki[0]?.grubosc || LIMITY_PALETY.GRUBOSC_PLYTY_MM;
  
  return liczbaPoziomow * grubosc;
};

/**
 * Oblicza liczbę poziomów dla danej ilości formatek
 */
export const obliczLiczbePoziomow = (liczbaFormatek: number): number => {
  return Math.ceil(liczbaFormatek / LIMITY_PALETY.FORMATEK_NA_POZIOM);
};

/**
 * Sprawdza czy paleta przekracza limity
 */
export const sprawdzLimity = (waga: number, wysokosc: number) => {
  return {
    przekroczonaWaga: waga > LIMITY_PALETY.MAX_WAGA_KG,
    przekroczonaWysokosc: wysokosc > LIMITY_PALETY.MAX_WYSOKOSC_MM,
    procentWagi: (waga / LIMITY_PALETY.MAX_WAGA_KG) * 100,
    procentWysokosci: (wysokosc / LIMITY_PALETY.MAX_WYSOKOSC_MM) * 100,
    ostrzezenieWaga: waga > LIMITY_PALETY.MAX_WAGA_KG * 0.9,
    ostrzezenieWysokosc: wysokosc > LIMITY_PALETY.MAX_WYSOKOSC_MM * 0.9
  };
};

/**
 * Oblicza statystyki palety
 */
export const obliczStatystykiPalety = (formatki: FormatkaZIloscia[]): PaletaStats => {
  const waga = obliczWageFormatek(formatki);
  const wysokosc = obliczWysokoscStosu(formatki);
  const liczbaFormatek = formatki.reduce((sum, f) => sum + f.ilosc_na_palecie, 0);
  const limity = sprawdzLimity(waga, wysokosc);
  
  // Wyciągnij unikalne kolory
  const kolory = [...new Set(formatki.map(f => f.kolor).filter(Boolean))] as string[];
  
  return {
    waga_aktualna: waga,
    wysokosc_aktualna: wysokosc,
    procent_wagi: limity.procentWagi,
    procent_wysokosci: limity.procentWysokosci,
    liczba_poziomow: obliczLiczbePoziomow(liczbaFormatek),
    liczba_formatek: liczbaFormatek,
    kolory
  };
};

/**
 * Oblicza powierzchnię formatek
 */
export const obliczPowierzchnie = (formatki: FormatkaZIloscia[]): number => {
  return formatki.reduce((suma, f) => {
    const powierzchniaSztuki = (f.wymiar_x * f.wymiar_y) / 1000000; // m²
    return suma + (powierzchniaSztuki * f.ilosc_na_palecie);
  }, 0);
};

/**
 * Sprawdza czy można dodać formatki do palety
 */
export const czyMoznaDodacFormatki = (
  obecneFormatki: FormatkaZIloscia[],
  noweFormatki: FormatkaZIloscia[],
  maxWaga: number = LIMITY_PALETY.MAX_WAGA_KG,
  maxWysokosc: number = LIMITY_PALETY.MAX_WYSOKOSC_MM
): { mozna: boolean; powod?: string } => {
  const wszystkieFormatki = [...obecneFormatki, ...noweFormatki];
  const nowaWaga = obliczWageFormatek(wszystkieFormatki);
  const nowaWysokosc = obliczWysokoscStosu(wszystkieFormatki);
  
  if (nowaWaga > maxWaga) {
    return { 
      mozna: false, 
      powod: `Przekroczony limit wagi (${nowaWaga.toFixed(1)} kg > ${maxWaga} kg)` 
    };
  }
  
  if (nowaWysokosc > maxWysokosc) {
    return { 
      mozna: false, 
      powod: `Przekroczony limit wysokości (${nowaWysokosc} mm > ${maxWysokosc} mm)` 
    };
  }
  
  return { mozna: true };
};

/**
 * Sugeruje optymalną ilość formatek do dodania
 */
export const sugerujIloscFormatek = (
  formatka: Formatka,
  obecneFormatki: FormatkaZIloscia[],
  dostepnaIlosc: number,
  maxWaga: number = LIMITY_PALETY.MAX_WAGA_KG,
  maxWysokosc: number = LIMITY_PALETY.MAX_WYSOKOSC_MM
): number => {
  const obecnaWaga = obliczWageFormatek(obecneFormatki);
  const obecnaWysokosc = obliczWysokoscStosu(obecneFormatki);
  const wagaSztuki = obliczWageSztuki(formatka);
  const grubosc = formatka.grubosc || LIMITY_PALETY.GRUBOSC_PLYTY_MM;
  
  // Oblicz maksymalną ilość ze względu na wagę
  const pozostalaWaga = maxWaga - obecnaWaga;
  const maxZeWzgleduNaWage = Math.floor(pozostalaWaga / wagaSztuki);
  
  // Oblicz maksymalną ilość ze względu na wysokość
  const obecnaLiczbaFormatek = obecneFormatki.reduce((sum, f) => sum + f.ilosc_na_palecie, 0);
  const pozostalaWysokosc = maxWysokosc - obecnaWysokosc;
  const pozostalePoziomy = Math.floor(pozostalaWysokosc / grubosc);
  const maxZeWzgleduNaWysokosc = pozostalePoziomy * LIMITY_PALETY.FORMATEK_NA_POZIOM - 
    (obecnaLiczbaFormatek % LIMITY_PALETY.FORMATEK_NA_POZIOM);
  
  // Weź minimum z wszystkich ograniczeń
  return Math.min(
    dostepnaIlosc,
    maxZeWzgleduNaWage,
    maxZeWzgleduNaWysokosc
  );
};

/**
 * Formatuje wagę do wyświetlenia
 * NAPRAWIONE: Obsługuje różne typy danych
 */
export const formatujWage = (waga: number | string | null | undefined): string => {
  // Konwertuj do liczby jeśli to możliwe
  const wagaNum = Number(waga);
  
  // Sprawdź czy konwersja się udała
  if (isNaN(wagaNum) || wagaNum === null || wagaNum === undefined) {
    return '0.0 kg';
  }
  
  return `${wagaNum.toFixed(1)} kg`;
};

/**
 * Formatuje wysokość do wyświetlenia
 */
export const formatujWysokosc = (wysokosc: number | string | null | undefined): string => {
  // Konwertuj do liczby jeśli to możliwe
  const wysokoscNum = Number(wysokosc);
  
  // Sprawdź czy konwersja się udała
  if (isNaN(wysokoscNum) || wysokoscNum === null || wysokoscNum === undefined) {
    return '0 mm';
  }
  
  if (wysokoscNum >= 1000) {
    return `${(wysokoscNum / 1000).toFixed(2)} m`;
  }
  return `${Math.round(wysokoscNum)} mm`;
};

/**
 * Oblicza procent wykorzystania palety
 */
export const obliczProcentWykorzystania = (
  waga: number, 
  wysokosc: number,
  maxWaga: number = LIMITY_PALETY.MAX_WAGA_KG,
  maxWysokosc: number = LIMITY_PALETY.MAX_WYSOKOSC_MM
): number => {
  const procentWagi = (waga / maxWaga) * 100;
  const procentWysokosci = (wysokosc / maxWysokosc) * 100;
  // Zwróć większy procent - to określa rzeczywiste wykorzystanie
  return Math.max(procentWagi, procentWysokosci);
};
