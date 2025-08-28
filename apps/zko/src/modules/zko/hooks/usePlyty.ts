import { useState, useEffect } from 'react';
import { message } from 'antd';
import type { Plyta } from '../components/AddPozycja/types';

interface UsePlytyOptions {
  search?: string;
  grubosc?: number;
  limit?: number;
  autoFetch?: boolean;
}

export const usePlyty = (options: UsePlytyOptions = {}) => {
  const { search, grubosc, limit = 100, autoFetch = true } = options;
  
  const [plyty, setPlyty] = useState<Plyta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlyty = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (grubosc) params.append('grubosc', grubosc.toString());
      if (limit) params.append('limit', limit.toString());
      
      const url = `http://localhost:5000/api/plyty/active${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPlyty(data.data || []);
      } else {
        throw new Error(data.error || 'Nieznany błąd API');
      }
      
    } catch (err: any) {
      console.error('Error fetching plyty:', err);
      setError(err.message);
      
      // Fallback do danych testowych
      message.warning('Nie można pobrać płyt z bazy - używam danych testowych');
      setPlyty([
        {
          id: 1, nazwa: '18_WOTAN', opis: '18_WOTAN_2800X2100',
          kolor_nazwa: 'WOTAN', grubosc: 18, stan_magazynowy: 56,
          aktywna: true, struktura: 1, cena_za_plyte: 120
        },
        {
          id: 2, nazwa: '18_BIALY', opis: '18_BIALY_2800X2070',
          kolor_nazwa: 'BIALY', grubosc: 18, stan_magazynowy: 60,
          aktywna: true, cena_za_plyte: 121
        },
        {
          id: 3, nazwa: 'HDF_BIALY', opis: '3_HDF_BIALY_2800X2075',
          kolor_nazwa: 'HDF_BIALY', grubosc: 3, stan_magazynowy: 89,
          aktywna: true, cena_za_plyte: 45
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPlyty();
    }
  }, [search, grubosc, limit, autoFetch]);

  return {
    plyty,
    loading,
    error,
    refetch: fetchPlyty,
    // Pomocne funkcje
    getPlytyByGrubosc: (targetGrubosc: number) => 
      plyty.filter(p => p.grubosc === targetGrubosc),
    getPlytyByKolor: (kolor: string) => 
      plyty.filter(p => p.kolor_nazwa === kolor),
    getMaxPlytForColor: (kolor: string) => {
      const plyta = plyty.find(p => p.kolor_nazwa === kolor);
      return plyta && plyta.grubosc >= 18 ? 5 : 50;
    }
  };
};

// Hook do kolorów płyt
export const useKoloryPlyty = () => {
  const [kolory, setKolory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKolory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/plyty/kolory');
      
      if (response.ok) {
        const data = await response.json();
        setKolory(data.kolory || []);
      }
    } catch (error) {
      console.error('Error fetching kolory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKolory();
  }, []);

  return { kolory, loading, refetch: fetchKolory };
};
