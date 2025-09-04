/**
 * @fileoverview Hook do zarządzania formatkami z poprawnym parsowaniem kolorów
 * @module PaletyZko/hooks/useFormatki
 */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { Formatka } from '../types';

interface UseFormatkiReturn {
  formatki: Formatka[];
  loading: boolean;
  fetchFormatki: () => Promise<void>;
  getFormatkiDostepne: () => Formatka[];
  obliczStatystyki: () => {
    totalPlanowane: number;
    totalNaPaletach: number;
    totalDostepne: number;
    wykorzystanie: number;
  };
}

export const useFormatki = (pozycjaId?: number): UseFormatkiReturn => {
  const [formatki, setFormatki] = useState<Formatka[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFormatki = useCallback(async () => {
    if (!pozycjaId) {
      setFormatki([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/zko/pozycje/${pozycjaId}/formatki`);
      if (!response.ok) {
        throw new Error('Błąd pobierania formatek');
      }

      const data = await response.json();
      
      // Parsuj formatki - wyciągnij kolor z nazwy formatki
      const parsedFormatki = (data.formatki || []).map((f: any) => {
        // Nazwa formatki ma format: "494x368 - BIALY" lub "794x368 - WOTAN"
        const nazwaParts = (f.nazwa_formatki || '').split(' - ');
        const wymiary = nazwaParts[0] || '';
        const kolor = nazwaParts[1] || f.kolor || 'NIEZNANY';
        
        // Wyciągnij wymiary z nazwy
        const wymParts = wymiary.split('x');
        const dlugosc = parseFloat(wymParts[0]) || f.dlugosc || 0;
        const szerokosc = parseFloat(wymParts[1]) || f.szerokosc || 0;
        
        // Znajdź odpowiednią płytę dla tego koloru
        let nazwaPlytaDlaKoloru = f.nazwa_plyty || '';
        if (f.nazwa_plyty && f.nazwa_plyty.includes(',')) {
          // Jeśli nazwa_plyty ma wiele płyt oddzielonych przecinkami
          const plyty = f.nazwa_plyty.split(',').map((p: string) => p.trim());
          // Spróbuj znaleźć płytę zawierającą kolor
          const matchingPlyta = plyty.find((p: string) => 
            p.toUpperCase().includes(kolor.toUpperCase())
          );
          if (matchingPlyta) {
            nazwaPlytaDlaKoloru = matchingPlyta;
          }
        } else if (f.nazwa_plyty && f.nazwa_plyty.includes(kolor)) {
          nazwaPlytaDlaKoloru = f.nazwa_plyty;
        } else {
          // Domyślna nazwa płyty z kolorem
          nazwaPlytaDlaKoloru = `18_${kolor}`;
        }
        
        return {
          ...f,
          id: f.id,
          nazwa_formatki: f.nazwa_formatki,
          dlugosc: dlugosc,
          szerokosc: szerokosc,
          wymiar_x: dlugosc,
          wymiar_y: szerokosc,
          grubosc: f.grubosc || 18,
          kolor: kolor,
          kolor_plyty: kolor,
          nazwa_plyty: nazwaPlytaDlaKoloru,
          numer_formatki: wymiary,
          ilosc_planowana: f.ilosc_planowana || 0,
          ilosc_na_paletach: f.ilosc_na_paletach || 0,
          ilosc_dostepna: (f.ilosc_planowana || 0) - (f.ilosc_na_paletach || 0),
          sztuki_dostepne: (f.ilosc_planowana || 0) - (f.ilosc_na_paletach || 0),
          typ_plyty: f.typ_plyty || 'laminat',
          kierunek_produkcji: f.kierunek_produkcji || 'STANDARD',
          sciezka_produkcji: f.sciezka_produkcji || 'CIECIE->OKLEJANIE->MAGAZYN',
          wymaga_oklejania: f.wymaga_oklejania !== false,
          wiercone: f.wiercone === true,
        };
      });

      console.log('Parsed formatki:', parsedFormatki);
      setFormatki(parsedFormatki);
    } catch (error: any) {
      console.error('Błąd pobierania formatek:', error);
      message.error('Błąd pobierania formatek');
      setFormatki([]);
    } finally {
      setLoading(false);
    }
  }, [pozycjaId]);

  useEffect(() => {
    fetchFormatki();
  }, [pozycjaId]);

  const getFormatkiDostepne = useCallback((): Formatka[] => {
    return formatki.filter(f => f.ilosc_dostepna > 0);
  }, [formatki]);

  const obliczStatystyki = useCallback(() => {
    const totalPlanowane = formatki.reduce((sum, f) => sum + f.ilosc_planowana, 0);
    const totalNaPaletach = formatki.reduce((sum, f) => sum + f.ilosc_na_paletach, 0);
    const totalDostepne = totalPlanowane - totalNaPaletach;
    const wykorzystanie = totalPlanowane > 0 ? (totalNaPaletach / totalPlanowane) * 100 : 0;

    return {
      totalPlanowane,
      totalNaPaletach,
      totalDostepne,
      wykorzystanie
    };
  }, [formatki]);

  return {
    formatki,
    loading,
    fetchFormatki,
    getFormatkiDostepne,
    obliczStatystyki
  };
};