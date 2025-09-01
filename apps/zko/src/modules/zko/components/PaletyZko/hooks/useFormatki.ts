/**
 * @fileoverview Hook do zarządzania formatkami
 * @module PaletyZko/hooks/useFormatki
 */

import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import axios from 'axios';
import { Formatka, ApiResponse } from '../types';

// Używamy proxy z Vite - /api jest przekierowane na localhost:5001
const API_URL = '/api';

export const useFormatki = (pozycjaId?: number) => {
  const [formatki, setFormatki] = useState<Formatka[]>([]);
  const [loading, setLoading] = useState(false);
  const [formatkiNaPaletach, setFormatkiNaPaletach] = useState<Map<number, number>>(new Map());

  /**
   * Pobiera formatki dla pozycji
   */
  const fetchFormatki = useCallback(async () => {
    if (!pozycjaId) {
      setFormatki([]);
      return;
    }

    setLoading(true);
    try {
      // POPRAWIONY ENDPOINT - używamy /api/zko/pozycje/:id/formatki
      const response = await axios.get(
        `${API_URL}/zko/pozycje/${pozycjaId}/formatki`
      );

      if (response.data) {
        // Mapuj dane z backendu na nasz format
        const formatkiData = response.data.formatki || response.data || [];
        setFormatki(formatkiData.map((f: any) => ({
          id: f.id,
          pozycja_id: f.pozycja_id,
          wymiar_x: f.dlugosc || f.wymiar_x || 0,
          wymiar_y: f.szerokosc || f.wymiar_y || 0,
          ilosc_szt: f.ilosc_planowana || f.ilosc_szt || 0,
          ilosc_dostepna: f.ilosc_planowana || f.ilosc_dostepna || 0,
          typ: f.typ || 'formatka',
          kolor: f.kolor || f.kolor_plyty,
          grubosc: f.grubosc || 18,
          waga_sztuki: f.waga_sztuki,
          nazwa_plyty: f.nazwa_plyty,
          numer_formatki: f.nazwa_formatki || f.numer_formatki
        })));
        
        // Ustaw mapę formatek na paletach (jeśli jest dostępna)
        const mapa = new Map<number, number>();
        if (response.data.na_paletach) {
          Object.entries(response.data.na_paletach).forEach(([id, ilosc]) => {
            mapa.set(Number(id), Number(ilosc));
          });
        }
        setFormatkiNaPaletach(mapa);
      }
    } catch (error) {
      console.error('Błąd pobierania formatek:', error);
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        message.error('Nie udało się pobrać formatek');
      }
      setFormatki([]);
    } finally {
      setLoading(false);
    }
  }, [pozycjaId]);

  /**
   * Oblicza dostępną ilość formatki (nie przypisaną do palet)
   */
  const obliczDostepnaIlosc = useCallback((formatka: Formatka): number => {
    const naPaletach = formatkiNaPaletach.get(formatka.id) || 0;
    const calkowita = formatka.ilosc_szt || 0;
    return Math.max(0, calkowita - naPaletach);
  }, [formatkiNaPaletach]);

  /**
   * Zwraca formatki z obliczoną dostępną ilością
   */
  const getFormatkiZDostepnoscia = useCallback((): Formatka[] => {
    return formatki.map(f => ({
      ...f,
      ilosc_dostepna: obliczDostepnaIlosc(f)
    }));
  }, [formatki, obliczDostepnaIlosc]);

  /**
   * Grupuje formatki po kolorze
   */
  const grupujPoKolorze = useCallback((): Map<string, Formatka[]> => {
    const grupy = new Map<string, Formatka[]>();
    
    formatki.forEach(f => {
      const kolor = f.kolor || 'BRAK';
      if (!grupy.has(kolor)) {
        grupy.set(kolor, []);
      }
      grupy.get(kolor)!.push(f);
    });
    
    return grupy;
  }, [formatki]);

  /**
   * Grupuje formatki po typie
   */
  const grupujPoTypie = useCallback((): Map<string, Formatka[]> => {
    const grupy = new Map<string, Formatka[]>();
    
    formatki.forEach(f => {
      const typ = f.typ || 'formatka';
      if (!grupy.has(typ)) {
        grupy.set(typ, []);
      }
      grupy.get(typ)!.push(f);
    });
    
    return grupy;
  }, [formatki]);

  /**
   * Znajduje formatkę po ID
   */
  const znajdzFormatke = useCallback((id: number): Formatka | undefined => {
    return formatki.find(f => f.id === id);
  }, [formatki]);

  /**
   * Oblicza statystyki formatek
   */
  const obliczStatystyki = useCallback(() => {
    const stats = {
      liczbaFormatek: formatki.length,
      sztukiTotal: 0,
      sztukiDostepne: 0,
      sztukiNaPaletach: 0,
      liczbaKolorow: 0,
      liczbaTypow: 0,
      wagaTotal: 0
    };

    const kolory = new Set<string>();
    const typy = new Set<string>();

    formatki.forEach(f => {
      const dostepne = obliczDostepnaIlosc(f);
      const naPaletach = formatkiNaPaletach.get(f.id) || 0;
      
      stats.sztukiTotal += f.ilosc_szt || 0;
      stats.sztukiDostepne += dostepne;
      stats.sztukiNaPaletach += naPaletach;
      
      if (f.kolor) kolory.add(f.kolor);
      if (f.typ) typy.add(f.typ);
      
      // Oblicz wagę
      if (f.waga_sztuki) {
        stats.wagaTotal += f.waga_sztuki * (f.ilosc_szt || 0);
      }
    });

    stats.liczbaKolorow = kolory.size;
    stats.liczbaTypow = typy.size;

    return stats;
  }, [formatki, obliczDostepnaIlosc, formatkiNaPaletach]);

  /**
   * Filtruje formatki dostępne do dodania
   */
  const getFormatkiDostepne = useCallback((): Formatka[] => {
    return getFormatkiZDostepnoscia().filter(f => f.ilosc_dostepna > 0);
  }, [getFormatkiZDostepnoscia]);

  /**
   * Sortuje formatki
   */
  const sortujFormatki = useCallback((
    kierunek: 'rozmiar' | 'kolor' | 'typ' | 'ilosc' = 'rozmiar'
  ): Formatka[] => {
    const sorted = [...formatki];
    
    switch (kierunek) {
      case 'rozmiar':
        sorted.sort((a, b) => {
          const powA = (a.wymiar_x * a.wymiar_y);
          const powB = (b.wymiar_x * b.wymiar_y);
          return powB - powA; // Największe najpierw
        });
        break;
      case 'kolor':
        sorted.sort((a, b) => (a.kolor || '').localeCompare(b.kolor || ''));
        break;
      case 'typ':
        sorted.sort((a, b) => (a.typ || '').localeCompare(b.typ || ''));
        break;
      case 'ilosc':
        sorted.sort((a, b) => (b.ilosc_szt || 0) - (a.ilosc_szt || 0));
        break;
    }
    
    return sorted;
  }, [formatki]);

  // Pobierz formatki przy zmianie pozycji
  useEffect(() => {
    if (pozycjaId) {
      fetchFormatki();
    }
  }, [pozycjaId, fetchFormatki]);

  return {
    formatki,
    loading,
    formatkiNaPaletach,
    fetchFormatki,
    obliczDostepnaIlosc,
    getFormatkiZDostepnoscia,
    getFormatkiDostepne,
    grupujPoKolorze,
    grupujPoTypie,
    znajdzFormatke,
    obliczStatystyki,
    sortujFormatki
  };
};