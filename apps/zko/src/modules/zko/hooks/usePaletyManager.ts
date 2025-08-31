import { useState, useCallback } from 'react';
import { message } from 'antd';
import { LIMITY_PALETY, MESSAGES } from '../components/PaletyManager/types';

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids?: number[];
  formatki_szczegoly?: any[];
  pozycje_lista?: string;
  typ?: string;
  created_at?: string;
  updated_at?: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
  przeznaczenie?: string;
}

interface PozycjaFormatka {
  id: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  grubosc: number;
  kolor: string;
  ilosc_planowana: number;
  waga_sztuka: number;
  ilosc_w_paletach: number;
  ilosc_dostepna: number;
  czy_w_pelni_przypisana: boolean;
}

export const usePaletyManager = (zkoId: number) => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [pozycjaFormatki, setPozycjaFormatki] = useState<PozycjaFormatka[]>([]);
  const [podsumowanie, setPodsumowanie] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deletingPaletaId, setDeletingPaletaId] = useState<number | null>(null);

  const fetchPalety = useCallback(async () => {
    try {
      setLoading(true);
      
      let response = await fetch(`/api/pallets/zko/${zkoId}/details`);
      
      if (!response.ok) {
        response = await fetch(`/api/pallets/zko/${zkoId}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        
        const mappedPalety = (data.palety || []).map((p: any) => ({
          ...p,
          ilosc_formatek: p.sztuk_total || p.ilosc_formatek || 0,
          procent_wykorzystania: p.sztuk_total 
            ? Math.round((p.sztuk_total / LIMITY_PALETY.DOMYSLNE_FORMATEK) * 100)
            : p.procent_wykorzystania || 0
        }));
        
        setPalety(mappedPalety);
        setPodsumowanie(data.podsumowanie);
      } else {
        const error = await response.json();
        message.error(error.error || MESSAGES.PLAN_ERROR);
      }
    } catch (error) {
      console.error('Error fetching palety:', error);
      message.error(MESSAGES.PLAN_ERROR);
    } finally {
      setLoading(false);
    }
  }, [zkoId]);

  const fetchPozycjaFormatki = useCallback(async (pozycjaId: number) => {
    if (!pozycjaId) return;
    
    try {
      const response = await fetch(`/api/pallets/position/${pozycjaId}/available-formatki`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.sukces) {
          const mappedFormatki = data.formatki.map((f: any) => ({
            id: f.id,
            nazwa: f.nazwa || f.nazwa_formatki || `${f.dlugosc}x${f.szerokosc}`,
            dlugosc: Number(f.dlugosc),
            szerokosc: Number(f.szerokosc),
            grubosc: Number(f.grubosc || 18),
            kolor: f.kolor,
            ilosc_planowana: f.ilosc_planowana,
            waga_sztuka: Number(f.waga_sztuka),
            ilosc_w_paletach: f.ilosc_w_paletach || 0,
            ilosc_dostepna: f.ilosc_dostepna || f.ilosc_planowana,
            czy_w_pelni_przypisana: f.czy_w_pelni_przypisana || false
          }));
          
          setPozycjaFormatki(mappedFormatki);
        } else {
          message.error(data.error || 'Błąd pobierania formatek');
        }
      } else {
        message.error('Błąd komunikacji z serwerem');
      }
    } catch (error) {
      console.error('Error fetching pozycja formatki:', error);
      message.error('Błąd pobierania formatek z pozycji');
    }
  }, []);

  const deletePaleta = useCallback(async (paletaId: number, onSuccess?: () => void) => {
    try {
      setDeletingPaletaId(paletaId);
      
      const response = await fetch(`/api/pallets/${paletaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Paleta została usunięta');
        await fetchPalety();
        onSuccess?.();
      } else {
        const error = await response.json();
        message.error(error.error || 'Błąd usuwania palety');
      }
    } catch (error) {
      console.error('Error deleting paleta:', error);
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setDeletingPaletaId(null);
    }
  }, [fetchPalety]);

  const deleteAllPalety = useCallback(async (onSuccess?: () => void) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/clear`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.sukces) {
        message.success(`Usunięto ${data.usuniete} palet`);
        await fetchPalety();
        onSuccess?.();
      } else {
        message.error(data.error || 'Błąd usuwania palet');
      }
    } catch (error) {
      console.error('Error deleting all pallets:', error);
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setLoading(false);
    }
  }, [zkoId, fetchPalety]);

  const createAllRemainingPallet = useCallback(async (
    pozycjaId: number, 
    przeznaczenie: string = 'MAGAZYN',
    onSuccess?: () => void
  ) => {
    if (!pozycjaId) {
      message.error('Brak ID pozycji');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/pallets/manual/create-all-remaining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pozycja_id: pozycjaId,
          przeznaczenie,
          operator: 'user'
        }),
      });

      const data = await response.json();

      if (response.ok && data.sukces) {
        message.success(`✅ Utworzono paletę ${data.numer_palety} ze wszystkimi pozostałymi formatkami (${data.total_sztuk} szt.)!`);
        await fetchPalety();
        await fetchPozycjaFormatki(pozycjaId);
        onSuccess?.();
      } else {
        message.error(data.error || 'Błąd tworzenia palety');
      }
    } catch (error) {
      console.error('Error creating all-remaining pallet:', error);
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setLoading(false);
    }
  }, [fetchPalety, fetchPozycjaFormatki]);

  const saveManualPallets = useCallback(async (
    pozycjaId: number,
    manualPalety: any[],
    onSuccess?: () => void
  ) => {
    if (!pozycjaId) {
      message.error('Brak ID pozycji - nie można zapisać palet');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/pallets/manual/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pozycja_id: pozycjaId,
          palety: manualPalety.map(paleta => ({
            formatki: paleta.formatki,
            przeznaczenie: paleta.przeznaczenie,
            max_waga: paleta.max_waga,
            max_wysokosc: paleta.max_wysokosc,
            operator: 'user',
            uwagi: paleta.uwagi || null
          }))
        }),
      });

      const data = await response.json();

      if (response.ok && data.sukces) {
        message.success(`✅ Zapisano ${data.palety_utworzone.length} palet do bazy danych!`);
        await fetchPalety();
        await fetchPozycjaFormatki(pozycjaId);
        onSuccess?.();
      } else {
        message.error(data.error || 'Błąd zapisywania palet do bazy danych');
      }
    } catch (error) {
      console.error('Error saving manual pallets:', error);
      message.error('Błąd komunikacji z serwerem podczas zapisywania palet');
    } finally {
      setLoading(false);
    }
  }, [fetchPalety, fetchPozycjaFormatki]);

  return {
    // State
    palety,
    pozycjaFormatki,
    podsumowanie,
    loading,
    deletingPaletaId,
    
    // Actions
    fetchPalety,
    fetchPozycjaFormatki,
    deletePaleta,
    deleteAllPalety,
    createAllRemainingPallet,
    saveManualPallets,
  };
};