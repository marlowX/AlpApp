/**
 * @fileoverview Hook do zarządzania paletami
 * @module PaletyZko/hooks/usePalety
 */

import { useState, useCallback, useEffect } from 'react';
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

  /**
   * Pobiera listę palet dla ZKO
   */
  const fetchPalety = useCallback(async () => {
    if (!zkoId) return;
    
    setLoading(true);
    try {
      // POPRAWIONY ENDPOINT - używamy /pallets/zko/:id/details
      const response = await axios.get(
        `${API_URL}/pallets/zko/${zkoId}/details`
      );
      
      if (response.data.sukces && response.data.palety) {
        setPalety(response.data.palety);
      } else {
        console.error('Błąd pobierania palet:', response.data.komunikat);
      }
    } catch (error) {
      console.error('Błąd pobierania palet:', error);
      // Nie pokazuj błędu jeśli to 404 - może po prostu nie ma jeszcze palet
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setPalety([]);
      } else {
        message.error('Nie udało się pobrać listy palet');
      }
    } finally {
      setLoading(false);
    }
  }, [zkoId]);

  /**
   * Tworzy nową paletę ręcznie
   * NAPRAWIONE: Nie konwertuj formatki do JSON string - backend to zrobi
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
          formatki: data.formatki, // NIE KONWERTUJ DO STRINGA - backend oczekuje array
          przeznaczenie: data.przeznaczenie,
          max_waga: data.max_waga_kg || 700,
          max_wysokosc: data.max_wysokosc_mm || 1440,
          uwagi: data.uwagi,
          operator: 'user'
        }
      );
      
      if (response.data.sukces) {
        message.success('Paleta utworzona pomyślnie');
        await fetchPalety(); // Odśwież listę
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
  }, [fetchPalety]);

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
          formatki: data.formatki || [], // NIE KONWERTUJ DO STRINGA
          przeznaczenie: data.przeznaczenie,
          uwagi: data.uwagi,
          operator: 'user'
        }
      );
      
      if (response.data.sukces) {
        message.success('Paleta zaktualizowana');
        await fetchPalety();
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
  }, [fetchPalety]);

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
        message.success('Paleta usunięta');
        await fetchPalety();
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
  }, [fetchPalety]);

  /**
   * Usuwa wszystkie palety ZKO
   * NAPRAWIONE: Poprawny endpoint /clear zamiast /all
   */
  const usunWszystkiePalety = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.delete<ApiResponse>(
        `${API_URL}/pallets/zko/${zkoId}/clear`  // POPRAWIONY ENDPOINT
      );
      
      if (response.data.sukces) {
        const usuniete = response.data.usuniete || 0;
        message.success(`Usunięto ${usuniete} palet`);
        setPalety([]);
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
   * Przenosi formatki między paletami
   */
  const przenieFormatki = useCallback(async (
    formatkaId: number,
    zPaletyId: number,
    naPaleteId: number,
    ilosc: number
  ): Promise<boolean> => {
    try {
      const response = await axios.put<ApiResponse>(
        `${API_URL}/pallets/reorganize`,
        {
          z_palety_id: zPaletyId,
          na_palete_id: naPaleteId,
          formatki_ids: [formatkaId],
          operator: 'user',
          powod: `Przeniesienie ${ilosc} szt. formatki`
        }
      );
      
      if (response.data.sukces) {
        message.success('Formatki przeniesione');
        await fetchPalety();
        return true;
      } else {
        message.error(response.data.komunikat || 'Błąd przenoszenia');
        return false;
      }
    } catch (error) {
      console.error('Błąd przenoszenia formatek:', error);
      message.error('Nie udało się przenieść formatek');
      return false;
    }
  }, [fetchPalety]);

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
        message.success('Paleta zamknięta i gotowa do transportu');
        await fetchPalety();
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
  }, [fetchPalety]);

  /**
   * Drukuje etykietę palety
   */
  const drukujEtykiete = useCallback(async (paletaId: number): Promise<void> => {
    try {
      // Pobierz szczegóły palety
      const response = await axios.get(`${API_URL}/pallets/${paletaId}`);
      const paleta = response.data;
      
      // Pobierz informacje o ZKO
      const zkoResponse = await axios.get(`${API_URL}/zko/${paleta.zko_id}`);
      const zko = zkoResponse.data;
      
      // Przygotuj dane do wydruku
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
      
      // Otwórz okno drukowania z etykietą
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
              .barcode {
                text-align: center;
                margin: 5mm 0;
                padding: 5mm;
                border: 1px solid #000;
                font-family: 'Courier New', monospace;
                font-size: 14pt;
                letter-spacing: 2px;
              }
              .footer {
                margin-top: 5mm;
                text-align: center;
                font-size: 8pt;
                color: #666;
              }
              .important {
                background: #ffeb3b;
                padding: 2mm;
                margin: 3mm 0;
                font-weight: bold;
                text-align: center;
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
              
              <div class="barcode">
                ${etykietaData.numerPalety}
              </div>
              
              <div class="field">
                <span class="field-label">ZKO:</span>
                <span class="field-value">${etykietaData.numerZKO}</span>
              </div>
              
              <div class="field">
                <span class="field-label">Przeznaczenie:</span>
                <span class="field-value">${etykietaData.przeznaczenie}</span>
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
              
              <div class="field">
                <span class="field-label">Kolory:</span>
                <span class="field-value">${etykietaData.kolory}</span>
              </div>
              
              <div class="field">
                <span class="field-label">Data utworzenia:</span>
                <span class="field-value">${etykietaData.dataUtworzenia}</span>
              </div>
              
              <div class="field">
                <span class="field-label">Data zamknięcia:</span>
                <span class="field-value">${etykietaData.dataZamkniecia}</span>
              </div>
              
              <div class="field">
                <span class="field-label">Operator:</span>
                <span class="field-value">${etykietaData.operator}</span>
              </div>
              
              ${etykietaData.uwagi ? `
                <div class="important">
                  Uwagi: ${etykietaData.uwagi}
                </div>
              ` : ''}
              
              <div class="footer">
                Wydrukowano: ${new Date().toLocaleString('pl-PL')}
              </div>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                // Zamknij okno po wydrukowaniu lub anulowaniu
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
   * UŻYWA NOWEGO ENDPOINTU
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
        await fetchPalety();
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
  }, [fetchPalety]);

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
      const sztuk = paleta.ilosc_formatek || paleta.sztuk_total || 0;
      const waga = paleta.waga_kg || 0;
      const wysokosc = paleta.wysokosc_stosu || 0;
      const maxWaga = paleta.max_waga_kg || 700;
      const maxWysokosc = paleta.max_wysokosc_mm || 1440;

      podsumowanie.sztuk_total += sztuk;
      podsumowanie.waga_total += waga;
      sumaWysokosci += wysokosc;

      // Procenty wykorzystania
      sumaProcentWagi += (waga / maxWaga) * 100;
      sumaProcentWysokosci += (wysokosc / maxWysokosc) * 100;

      // Grupowanie po przeznaczeniu
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
      fetchPalety();
    }
  }, [zkoId, fetchPalety]);

  return {
    palety,
    loading,
    creating,
    deleting,
    closing,
    podsumowanie: obliczPodsumowanie(),
    fetchPalety,
    utworzPalete,
    edytujPalete,
    usunPalete,
    usunWszystkiePalety,
    przenieFormatki,
    zamknijPalete,
    drukujEtykiete,
    utworzPaletyDlaPozostalych
  };
};
