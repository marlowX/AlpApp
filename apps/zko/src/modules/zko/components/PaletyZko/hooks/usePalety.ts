/**
 * @fileoverview Hook do zarządzania paletami - zoptymalizowane odświeżanie
 * @module PaletyZko/hooks/usePalety
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import axios from 'axios';
import { 
  Paleta, 
  PaletaFormData, 
  ApiResponse,
  PodsumowaniePalet,
  PRZEZNACZENIE_PALETY
} from '../types';

// Używamy proxy z Vite - /api jest przekierowane na localhost:5001
const API_URL = '/api';

export const usePalety = (zkoId: number) => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [closing, setClosing] = useState<number | null>(null);
  
  // Ref do śledzenia czy to pierwsze ładowanie
  const isFirstLoad = useRef(true);

  /**
   * Pobiera listę palet dla ZKO - BEZ MRUGANIA
   * @param silent - czy odświeżać bez pokazywania loadera
   */
  const fetchPalety = useCallback(async (silent: boolean = false) => {
    if (!zkoId) return;
    
    // Pokazuj loading tylko przy pierwszym ładowaniu lub gdy nie jest silent
    if (!silent && isFirstLoad.current) {
      setLoading(true);
    }
    
    try {
      const response = await axios.get(
        `${API_URL}/pallets/zko/${zkoId}/details`
      );
      
      if (response.data.sukces && response.data.palety) {
        // Porównaj z obecnymi danymi, aktualizuj tylko jeśli są zmiany
        const newPalety = response.data.palety;
        setPalety(prevPalety => {
          // Sprawdź czy dane się zmieniły
          if (JSON.stringify(prevPalety) !== JSON.stringify(newPalety)) {
            return newPalety;
          }
          return prevPalety;
        });
      }
    } catch (error) {
      // Błędy pokazuj tylko przy pierwszym ładowaniu
      if (isFirstLoad.current) {
        console.error('Błąd pobierania palet:', error);
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setPalety([]);
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      isFirstLoad.current = false;
    }
  }, [zkoId]);

  /**
   * Odśwież palety w tle (bez mrugania)
   */
  const refreshPaletySilently = useCallback(async () => {
    await fetchPalety(true);
  }, [fetchPalety]);

  /**
   * Tworzy nową paletę ręcznie
   */
  const utworzPalete = useCallback(async (
    pozycjaId: number,
    data: PaletaFormData
  ): Promise<Paleta | null> => {
    setCreating(true);
    try {
      const response = await axios.post<ApiResponse<Paleta>>(
        `${API_URL}/pallets/manual/create`,
        {
          pozycja_id: pozycjaId,
          formatki: data.formatki,
          przeznaczenie: data.przeznaczenie,
          max_waga: data.max_waga_kg || 700,
          max_wysokosc: data.max_wysokosc_mm || 1440,
          uwagi: data.uwagi,
          operator: 'user'
        }
      );
      
      if (response.data.sukces) {
        message.success('Paleta utworzona pomyślnie');
        await refreshPaletySilently(); // Odśwież bez mrugania
        return response.data;
      } else {
        message.error(response.data.komunikat || response.data.error || 'Błąd tworzenia palety');
        return null;
      }
    } catch (error) {
      console.error('Błąd tworzenia palety:', error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message.error(`Błąd: ${error.response.data.message}`);
      } else {
        message.error('Nie udało się utworzyć palety');
      }
      return null;
    } finally {
      setCreating(false);
    }
  }, [refreshPaletySilently]);

  /**
   * Edytuje istniejącą paletę
   */
  const edytujPalete = useCallback(async (
    paletaId: number,
    data: Partial<PaletaFormData>
  ): Promise<boolean> => {
    try {
      const response = await axios.post<ApiResponse>(
        `${API_URL}/pallets/${paletaId}/update-formatki`,
        {
          formatki: data.formatki || [],
          przeznaczenie: data.przeznaczenie,
          uwagi: data.uwagi,
          operator: 'user'
        }
      );
      
      if (response.data.sukces) {
        message.success('Paleta zaktualizowana');
        await refreshPaletySilently(); // Odśwież bez mrugania
        return true;
      } else {
        message.error(response.data.komunikat || 'Błąd aktualizacji');
        return false;
      }
    } catch (error) {
      console.error('Błąd edycji palety:', error);
      message.error('Nie udało się zaktualizować palety');
      return false;
    }
  }, [refreshPaletySilently]);

  /**
   * Usuwa paletę
   */
  const usunPalete = useCallback(async (paletaId: number): Promise<boolean> => {
    setDeleting(paletaId);
    try {
      const response = await axios.delete<ApiResponse>(
        `${API_URL}/pallets/${paletaId}`
      );
      
      if (response.data.sukces) {
        // Usuń lokalnie natychmiast dla płynności
        setPalety(prev => prev.filter(p => p.id !== paletaId));
        message.success('Paleta usunięta');
        // Odśwież w tle dla synchronizacji
        refreshPaletySilently();
        return true;
      } else {
        message.error(response.data.komunikat || 'Błąd usuwania');
        return false;
      }
    } catch (error) {
      console.error('Błąd usuwania palety:', error);
      message.error('Nie udało się usunąć palety');
      return false;
    } finally {
      setDeleting(null);
    }
  }, [refreshPaletySilently]);

  /**
   * Usuwa wszystkie palety ZKO
   */
  const usunWszystkiePalety = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.delete<ApiResponse>(
        `${API_URL}/pallets/zko/${zkoId}/clear`
      );
      
      if (response.data.sukces) {
        const usuniete = response.data.usuniete || 0;
        message.success(`Usunięto ${usuniete} palet`);
        setPalety([]); // Natychmiast wyczyść
        return true;
      } else {
        message.error(response.data.komunikat || 'Błąd usuwania');
        return false;
      }
    } catch (error) {
      console.error('Błąd usuwania palet:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Nie udało się usunąć palet');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [zkoId]);

  /**
   * Zamyka paletę
   */
  const zamknijPalete = useCallback(async (
    paletaId: number,
    uwagi?: string
  ): Promise<boolean> => {
    setClosing(paletaId);
    try {
      const response = await axios.post<ApiResponse>(
        `${API_URL}/pallets/${paletaId}/close`,
        {
          operator: 'user',
          uwagi: uwagi || 'Paleta zamknięta przez operatora'
        }
      );
      
      if (response.data.sukces) {
        // Zaktualizuj lokalnie status natychmiast
        setPalety(prev => prev.map(p => 
          p.id === paletaId 
            ? { ...p, status: 'zamknieta' }
            : p
        ));
        message.success('Paleta zamknięta i gotowa do transportu');
        // Odśwież w tle
        refreshPaletySilently();
        return true;
      } else {
        message.error(response.data.komunikat || 'Błąd zamykania');
        return false;
      }
    } catch (error) {
      console.error('Błąd zamykania palety:', error);
      message.error('Nie udało się zamknąć palety');
      return false;
    } finally {
      setClosing(null);
    }
  }, [refreshPaletySilently]);

  /**
   * Drukuje etykietę palety
   */
  const drukujEtykiete = useCallback(async (paletaId: number): Promise<void> => {
    try {
      const response = await axios.get(`${API_URL}/pallets/${paletaId}`);
      const paleta = response.data;
      
      const zkoResponse = await axios.get(`${API_URL}/zko/${paleta.zko_id}`);
      const zko = zkoResponse.data;
      
      const etykietaData = {
        numerPalety: paleta.numer_palety,
        numerZKO: zko.numer_zko,
        dataUtworzenia: new Date(paleta.created_at).toLocaleDateString('pl-PL'),
        dataZamkniecia: paleta.data_pakowania ? new Date(paleta.data_pakowania).toLocaleDateString('pl-PL') : '-',
        przeznaczenie: paleta.przeznaczenie || 'MAGAZYN',
        iloscFormatek: paleta.ilosc_formatek || 0,
        wagaKg: (paleta.waga_kg || 0).toFixed(1),
        wysokoscMm: paleta.wysokosc_stosu || 0,
        kolory: paleta.kolory_na_palecie || '-',
        operator: paleta.operator_pakujacy || 'user',
        uwagi: paleta.uwagi || ''
      };
      
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="pl">
          <head>
            <meta charset="UTF-8">
            <title>Etykieta palety ${etykietaData.numerPalety}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: Arial, sans-serif; 
                padding: 10mm;
                width: 100mm;
                background: white;
              }
              .label {
                border: 2px solid #000;
                padding: 5mm;
                page-break-inside: avoid;
              }
              h1 { 
                font-size: 20pt; 
                font-weight: bold;
                text-align: center;
                margin-bottom: 5mm;
                padding: 3mm;
                background: #000;
                color: white;
              }
              .field {
                margin: 3mm 0;
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #ddd;
                padding-bottom: 2mm;
              }
              .field-label {
                font-weight: bold;
                font-size: 10pt;
              }
              .field-value {
                font-size: 11pt;
                text-align: right;
              }
              @media print {
                body { margin: 0; padding: 0; width: 100%; }
                .label { border: 2px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="label">
              <h1>PALETA ${etykietaData.numerPalety}</h1>
              <div class="field">
                <span class="field-label">ZKO:</span>
                <span class="field-value">${etykietaData.numerZKO}</span>
              </div>
              <div class="field">
                <span class="field-label">Ilość formatek:</span>
                <span class="field-value">${etykietaData.iloscFormatek} szt.</span>
              </div>
              <div class="field">
                <span class="field-label">Waga:</span>
                <span class="field-value">${etykietaData.wagaKg} kg</span>
              </div>
              <div class="field">
                <span class="field-label">Wysokość:</span>
                <span class="field-value">${etykietaData.wysokoscMm} mm</span>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        message.error('Nie udało się otworzyć okna drukowania');
      }
    } catch (error) {
      console.error('Błąd drukowania etykiety:', error);
      message.error('Nie udało się wydrukować etykiety');
    }
  }, []);

  /**
   * Tworzy palety dla wszystkich pozostałych formatek
   */
  const utworzPaletyDlaPozostalych = useCallback(async (
    pozycjaId: number,
    przeznaczenie: keyof typeof PRZEZNACZENIE_PALETY = 'MAGAZYN'
  ): Promise<boolean> => {
    setCreating(true);
    try {
      const response = await axios.post<ApiResponse>(
        `${API_URL}/pallets/manual/create-all-remaining`,
        {
          pozycja_id: pozycjaId,
          przeznaczenie: przeznaczenie,
          operator: 'user'
        }
      );
      
      if (response.data.sukces) {
        message.success(`Utworzono paletę z ${response.data.formatki_dodane || 'wszystkimi'} formatkami`);
        await refreshPaletySilently(); // Odśwież bez mrugania
        return true;
      } else {
        message.error(response.data.komunikat || response.data.error || 'Błąd tworzenia');
        return false;
      }
    } catch (error) {
      console.error('Błąd tworzenia palet:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Nie udało się utworzyć palet');
      }
      return false;
    } finally {
      setCreating(false);
    }
  }, [refreshPaletySilently]);

  /**
   * Oblicza podsumowanie palet
   */
  const obliczPodsumowanie = useCallback((): PodsumowaniePalet => {
    const podsumowanie: PodsumowaniePalet = {
      liczba_palet: palety.length,
      sztuk_total: 0,
      waga_total: 0,
      wysokosc_avg: 0,
      procent_wykorzystania_wagi: 0,
      procent_wykorzystania_wysokosci: 0,
      po_przeznaczeniu: {}
    };

    if (palety.length === 0) return podsumowanie;

    let sumaWysokosci = 0;
    let sumaProcentWagi = 0;
    let sumaProcentWysokosci = 0;

    palety.forEach(paleta => {
      const sztuk = Number(paleta.ilosc_formatek || paleta.sztuk_total || 0);
      const waga = Number(paleta.waga_kg || 0);
      const wysokosc = Number(paleta.wysokosc_stosu || 0);
      const maxWaga = Number(paleta.max_waga_kg || 700);
      const maxWysokosc = Number(paleta.max_wysokosc_mm || 1440);

      podsumowanie.sztuk_total += sztuk;
      podsumowanie.waga_total += waga;
      sumaWysokosci += wysokosc;

      sumaProcentWagi += (waga / maxWaga) * 100;
      sumaProcentWysokosci += (wysokosc / maxWysokosc) * 100;

      const przezn = paleta.przeznaczenie || 'MAGAZYN';
      if (!podsumowanie.po_przeznaczeniu[przezn]) {
        podsumowanie.po_przeznaczeniu[przezn] = {
          liczba_palet: 0,
          sztuk: 0,
          waga: 0
        };
      }
      podsumowanie.po_przeznaczeniu[przezn]!.liczba_palet++;
      podsumowanie.po_przeznaczeniu[przezn]!.sztuk += sztuk;
      podsumowanie.po_przeznaczeniu[przezn]!.waga += waga;
    });

    podsumowanie.wysokosc_avg = sumaWysokosci / palety.length;
    podsumowanie.procent_wykorzystania_wagi = sumaProcentWagi / palety.length;
    podsumowanie.procent_wykorzystania_wysokosci = sumaProcentWysokosci / palety.length;

    return podsumowanie;
  }, [palety]);

  // Pobierz palety przy montowaniu
  useEffect(() => {
    if (zkoId) {
      fetchPalety(false); // Pierwsze ładowanie z loaderem
    }
  }, [zkoId]);

  return {
    palety,
    loading,
    creating,
    deleting,
    closing,
    podsumowanie: obliczPodsumowanie(),
    fetchPalety: () => fetchPalety(false), // Domyślnie z loaderem
    refreshPaletySilently, // Nowa metoda do cichego odświeżania
    utworzPalete,
    edytujPalete,
    usunPalete,
    usunWszystkiePalety,
    zamknijPalete,
    drukujEtykiete,
    utworzPaletyDlaPozostalych
  };
};