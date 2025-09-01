/**
 * @fileoverview Hook do zarządzania formatkami - Z FILTROWANIEM PRZYPISANYCH
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

      if (response.data && response.data.sukces) {
        // Mapuj dane z backendu na nasz format - UŻYWAMY DANYCH Z BACKENDU
        const formatkiData = response.data.formatki || [];
        
        // Ustaw mapę formatek na paletach
        const mapa = new Map<number, number>();
        
        const mappedFormatki = formatkiData.map((f: any) => {
          // Zapisz ile formatek jest na paletach
          if (f.ilosc_w_paletach > 0) {
            mapa.set(f.id, f.ilosc_w_paletach);
          }
          
          return {
            id: f.id,
            pozycja_id: f.pozycja_id,
            wymiar_x: f.dlugosc || 0,
            wymiar_y: f.szerokosc || 0,
            dlugosc: f.dlugosc || 0,
            szerokosc: f.szerokosc || 0,
            ilosc_szt: f.ilosc_planowana || 0,
            ilosc_dostepna: f.ilosc_dostepna || 0, // Backend już obliczył dostępność
            ilosc_na_paletach: f.ilosc_w_paletach || 0,
            czy_w_pelni_przypisana: f.czy_w_pelni_przypisana || false,
            typ: f.typ_formatki || 'formatka',
            kolor: f.kolor,
            kolor_plyty: f.kolor,
            grubosc: f.grubosc || 18,
            waga_sztuki: f.waga_sztuka,
            nazwa_plyty: f.nazwa_plyty,
            numer_formatki: f.nazwa || f.nazwa_formatki,
            nazwa_formatki: f.nazwa || f.nazwa_formatki,
            sztuki_dostepne: f.ilosc_dostepna || 0 // Dla kompatybilności
          };
        });
        
        setFormatki(mappedFormatki);
        setFormatkiNaPaletach(mapa);
        
        console.log('Loaded formatki:', {
          total: mappedFormatki.length,
          dostepne: mappedFormatki.filter((f: any) => f.ilosc_dostepna > 0).length,
          w_pelni_przypisane: mappedFormatki.filter((f: any) => f.czy_w_pelni_przypisana).length,
          podsumowanie: response.data.podsumowanie
        });
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
   * UWAGA: Teraz dane są już obliczone przez backend
   */
  const obliczDostepnaIlosc = useCallback((formatka: Formatka): number => {
    // Backend już obliczył dostępność, używamy wartości z serwera
    return formatka.ilosc_dostepna || 0;
  }, []);

  /**
   * Zwraca formatki z obliczoną dostępną ilością
   */
  const getFormatkiZDostepnoscia = useCallback((): Formatka[] => {
    return formatki; // Dane już mają obliczoną dostępność z backendu
  }, [formatki]);

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
      wagaTotal: 0,
      w_pelni_przypisane: 0
    };

    const kolory = new Set<string>();
    const typy = new Set<string>();

    formatki.forEach(f => {
      stats.sztukiTotal += f.ilosc_szt || 0;
      stats.sztukiDostepne += f.ilosc_dostepna || 0;
      stats.sztukiNaPaletach += (f as any).ilosc_na_paletach || 0;
      
      if ((f as any).czy_w_pelni_przypisana) {
        stats.w_pelni_przypisane++;
      }
      
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
  }, [formatki]);

  /**
   * 🔥 KLUCZOWA METODA - Filtruje formatki dostępne do dodania
   * Zwraca tylko te formatki, które NIE są w pełni przypisane do palet
   */
  const getFormatkiDostepne = useCallback((): Formatka[] => {
    // Filtruj formatki które mają jeszcze dostępne sztuki
    const dostepne = formatki.filter(f => {
      const iloscDostepna = f.ilosc_dostepna || 0;
      const czyWPelniPrzypisana = (f as any).czy_w_pelni_przypisana || false;
      
      // Zwracaj tylko te które:
      // 1. Mają dostępne sztuki (ilosc_dostepna > 0)
      // 2. NIE są w pełni przypisane
      return iloscDostepna > 0 && !czyWPelniPrzypisana;
    });
    
    console.log(`Formatki dostępne do dodania: ${dostepne.length} z ${formatki.length}`);
    
    return dostepne;
  }, [formatki]);

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