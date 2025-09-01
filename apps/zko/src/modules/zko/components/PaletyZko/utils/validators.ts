/**
 * @fileoverview Funkcje walidacyjne dla modułu PaletyZko
 * @module PaletyZko/utils/validators
 */

import { LIMITY_PALETY, Formatka, PaletaFormData } from '../types';

/**
 * Waliduje dane formularza palety
 */
export const walidujPalete = (data: PaletaFormData): { 
  valid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  // Sprawdź przeznaczenie
  if (!data.przeznaczenie) {
    errors.push('Przeznaczenie palety jest wymagane');
  }
  
  // Sprawdź formatki
  if (!data.formatki || data.formatki.length === 0) {
    errors.push('Paleta musi zawierać przynajmniej jedną formatkę');
  }
  
  // Sprawdź ilości formatek
  data.formatki?.forEach((f, index) => {
    if (f.ilosc <= 0) {
      errors.push(`Formatka ${index + 1}: ilość musi być większa od 0`);
    }
  });
  
  // Sprawdź limity
  if (data.max_waga_kg && data.max_waga_kg > LIMITY_PALETY.MAX_WAGA_KG) {
    errors.push(`Maksymalna waga nie może przekraczać ${LIMITY_PALETY.MAX_WAGA_KG} kg`);
  }
  
  if (data.max_wysokosc_mm && data.max_wysokosc_mm > LIMITY_PALETY.MAX_WYSOKOSC_MM) {
    errors.push(`Maksymalna wysokość nie może przekraczać ${LIMITY_PALETY.MAX_WYSOKOSC_MM} mm`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sprawdza czy formatka może być dodana do palety
 */
export const walidujDodanieFormatki = (
  formatka: Formatka,
  ilosc: number,
  dostepnaIlosc: number
): { valid: boolean; error?: string } => {
  if (ilosc <= 0) {
    return { valid: false, error: 'Ilość musi być większa od 0' };
  }
  
  if (ilosc > dostepnaIlosc) {
    return { 
      valid: false, 
      error: `Dostępna ilość: ${dostepnaIlosc} szt.` 
    };
  }
  
  return { valid: true };
};

/**
 * Waliduje przeniesienie formatek między paletami
 */
export const walidujPrzeniesenieFormatek = (
  ilosc: number,
  dostepnaIlosc: number,
  maxWagaDocelowa: number,
  obecnaWagaDocelowa: number,
  wagaFormatki: number
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (ilosc <= 0) {
    errors.push('Ilość musi być większa od 0');
  }
  
  if (ilosc > dostepnaIlosc) {
    errors.push(`Można przenieść maksymalnie ${dostepnaIlosc} szt.`);
  }
  
  const nowaWaga = obecnaWagaDocelowa + (wagaFormatki * ilosc);
  if (nowaWaga > maxWagaDocelowa) {
    errors.push(`Przekroczony limit wagi palety docelowej (${nowaWaga.toFixed(1)} kg > ${maxWagaDocelowa} kg)`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sprawdza czy numer palety jest poprawny
 */
export const walidujNumerPalety = (numer: string): boolean => {
  if (!numer || numer.trim().length === 0) {
    return false;
  }
  
  // Sprawdź format (opcjonalnie można dodać regex)
  // np. PAL-2025-01-001
  const formatRegex = /^(PAL-)?[\d\-]+$/;
  return formatRegex.test(numer);
};

/**
 * Waliduje wymiary formatki
 */
export const walidujWymiaryFormatki = (
  x: number,
  y: number
): { valid: boolean; error?: string } => {
  if (x <= 0 || y <= 0) {
    return { valid: false, error: 'Wymiary muszą być większe od 0' };
  }
  
  // Sprawdź czy mieszczą się na palecie
  const maxWymiar = Math.max(
    LIMITY_PALETY.PALETA_SZERKOSC_MM,
    LIMITY_PALETY.PALETA_DLUGOSC_MM
  );
  
  if (x > maxWymiar || y > maxWymiar) {
    return { 
      valid: false, 
      error: `Formatka nie mieści się na palecie (max ${maxWymiar} mm)` 
    };
  }
  
  return { valid: true };
};

/**
 * Sprawdza czy paleta może być zamknięta
 */
export const czyMoznaZamknacPalete = (
  liczbaFormatek: number,
  status: string
): { mozna: boolean; powod?: string } => {
  if (liczbaFormatek === 0) {
    return { mozna: false, powod: 'Paleta jest pusta' };
  }
  
  if (status === 'zamknieta') {
    return { mozna: false, powod: 'Paleta jest już zamknięta' };
  }
  
  if (status === 'w_transporcie') {
    return { mozna: false, powod: 'Paleta jest w transporcie' };
  }
  
  return { mozna: true };
};

/**
 * Waliduje dane do eksportu
 */
export const walidujEksport = (
  paletyIds: number[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!paletyIds || paletyIds.length === 0) {
    errors.push('Wybierz przynajmniej jedną paletę do eksportu');
  }
  
  if (paletyIds.length > 100) {
    errors.push('Można eksportować maksymalnie 100 palet jednocześnie');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sprawdza czy wartość jest numerem
 */
export const isValidNumber = (value: any): boolean => {
  return !isNaN(value) && isFinite(value) && value !== null;
};

/**
 * Sprawdza czy data jest prawidłowa
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * Waliduje uwagi/komentarz
 */
export const walidujUwagi = (uwagi: string): { 
  valid: boolean; 
  error?: string 
} => {
  if (uwagi && uwagi.length > 500) {
    return { 
      valid: false, 
      error: 'Uwagi nie mogą przekraczać 500 znaków' 
    };
  }
  return { valid: true };
};

/**
 * Sprawdza czy palety można scalić
 */
export const czyMoznaScalicPalety = (
  paleta1: { przeznaczenie: string; waga_kg: number; wysokosc_stosu: number },
  paleta2: { przeznaczenie: string; waga_kg: number; wysokosc_stosu: number }
): { mozna: boolean; powod?: string } => {
  if (paleta1.przeznaczenie !== paleta2.przeznaczenie) {
    return { mozna: false, powod: 'Palety mają różne przeznaczenia' };
  }
  
  const sumaWag = paleta1.waga_kg + paleta2.waga_kg;
  if (sumaWag > LIMITY_PALETY.MAX_WAGA_KG) {
    return { 
      mozna: false, 
      powod: `Suma wag przekracza limit (${sumaWag.toFixed(1)} kg > ${LIMITY_PALETY.MAX_WAGA_KG} kg)` 
    };
  }
  
  // Zakładamy że wysokości się nie sumują (formatki można przełożyć)
  const maxWysokosc = Math.max(paleta1.wysokosc_stosu, paleta2.wysokosc_stosu);
  if (maxWysokosc > LIMITY_PALETY.MAX_WYSOKOSC_MM) {
    return { 
      mozna: false, 
      powod: `Wysokość przekracza limit (${maxWysokosc} mm > ${LIMITY_PALETY.MAX_WYSOKOSC_MM} mm)` 
    };
  }
  
  return { mozna: true };
};
