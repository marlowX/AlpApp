import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import type { 
  Paleta, 
  PlanowaniePaletParams, 
  TransferFormatekParams,
  PlanPaletyzacji 
} from '../types';

interface UsePaletyDataReturn {
  palety: Paleta[];
  loading: boolean;
  error: string | null;
  fetchPalety: () => Promise<void>;
  planujPalety: (params: PlanowaniePaletParams) => Promise<PlanPaletyzacji[]>;
  zmienIloscPalet: (nowaIlosc: number) => Promise<boolean>;
  przeniesFormatki: (params: TransferFormatekParams) => Promise<boolean>;
  zamknijPalete: (paletaId: number, uwagi?: string) => Promise<boolean>;
  wyczyscPuste: () => Promise<boolean>;
}

export const usePaletyData = (zkoId: number): UsePaletyDataReturn => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pobieranie listy palet
  const fetchPalety = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPalety(data.palety || []);
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || 'Błąd pobierania palet';
        setError(errorMsg);
        message.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Błąd połączenia z serwerem';
      setError(errorMsg);
      message.error(errorMsg);
      console.error('Error fetching palety:', err);
    } finally {
      setLoading(false);
    }
  }, [zkoId]);

  // Automatyczne planowanie palet
  const planujPalety = useCallback(async (params: PlanowaniePaletParams): Promise<PlanPaletyzacji[]> => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || 'Zaplanowano palety');
          await fetchPalety();
          return result.plan || [];
        } else {
          throw new Error(result.komunikat || 'Nie udało się zaplanować palet');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd planowania palet');
      }
    } catch (err: any) {
      message.error(err.message || 'Błąd planowania palet');
      console.error('Error planning palety:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [zkoId, fetchPalety]);

  // Zmiana ilości palet
  const zmienIloscPalet = useCallback(async (nowaIlosc: number): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/change-quantity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nowa_ilosc: nowaIlosc })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || 'Zmieniono ilość palet');
          await fetchPalety();
          return true;
        } else {
          throw new Error(result.komunikat || 'Nie udało się zmienić ilości palet');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd zmiany ilości palet');
      }
    } catch (err: any) {
      message.error(err.message || 'Błąd zmiany ilości palet');
      console.error('Error changing pallet quantity:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [zkoId, fetchPalety]);

  // Przenoszenie formatek między paletami
  const przeniesFormatki = useCallback(async (params: TransferFormatekParams): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/pallets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || 'Przeniesiono formatki');
          await fetchPalety();
          return true;
        } else {
          throw new Error(result.komunikat || 'Nie udało się przenieść formatek');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd przenoszenia formatek');
      }
    } catch (err: any) {
      message.error(err.message || 'Błąd przenoszenia formatek');
      console.error('Error transferring formatki:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPalety]);

  // Zamykanie palety
  const zamknijPalete = useCallback(async (paletaId: number, uwagi: string = 'Zamknięcie palety z poziomu aplikacji'): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/pallets/${paletaId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator: 'system',
          uwagi
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || 'Zamknięto paletę');
          await fetchPalety();
          return true;
        } else {
          throw new Error(result.komunikat || 'Nie udało się zamknąć palety');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd zamykania palety');
      }
    } catch (err: any) {
      message.error(err.message || 'Błąd zamykania palety');
      console.error('Error closing pallet:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPalety]);

  // Wyczyszczenie pustych palet
  const wyczyscPuste = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/clean-empty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || `Usunięto ${result.usuniete} pustych palet`);
          await fetchPalety();
          return true;
        } else {
          throw new Error(result.komunikat || 'Nie udało się wyczyścić pustych palet');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd czyszczenia pustych palet');
      }
    } catch (err: any) {
      message.error(err.message || 'Błąd czyszczenia pustych palet');
      console.error('Error cleaning empty pallets:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [zkoId, fetchPalety]);

  // Efekt pobierania danych przy montowaniu
  useEffect(() => {
    if (zkoId) {
      fetchPalety();
    }
  }, [zkoId, fetchPalety]);

  return {
    palety,
    loading,
    error,
    fetchPalety,
    planujPalety,
    zmienIloscPalet,
    przeniesFormatki,
    zamknijPalete,
    wyczyscPuste
  };
};