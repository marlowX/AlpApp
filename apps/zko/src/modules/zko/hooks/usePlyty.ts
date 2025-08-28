import { useState, useEffect } from 'react';
import { message } from 'antd';
import type { Plyta } from '../components/AddPozycja/types';

interface UsePlytyOptions {
  search?: string;
  grubosc?: number;
  limit?: number;
  autoFetch?: boolean;
}

// Fallback data gdy API nie działa
const FALLBACK_PLYTY: Plyta[] = [
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
    id: 3, nazwa: '18_CZARNY', opis: '18_CZARNY_2800X2100',
    kolor_nazwa: 'CZARNY', grubosc: 18, stan_magazynowy: 45,
    aktywna: true, cena_za_plyte: 122
  },
  {
    id: 4, nazwa: 'HDF_BIALY', opis: '3_HDF_BIALY_2800X2075',
    kolor_nazwa: 'HDF_BIALY', grubosc: 3, stan_magazynowy: 89,
    aktywna: true, cena_za_plyte: 45
  },
  {
    id: 5, nazwa: '18_SONOMA', opis: '18_SONOMA_2800X2100',
    kolor_nazwa: 'SONOMA', grubosc: 18, stan_magazynowy: 35,
    aktywna: true, struktura: 1, cena_za_plyte: 118
  },
  {
    id: 6, nazwa: '12_BIALY', opis: '12_BIALY_2800X2070',
    kolor_nazwa: 'BIALY', grubosc: 12, stan_magazynowy: 75,
    aktywna: true, cena_za_plyte: 95
  }
];

export const usePlyty = (options: UsePlytyOptions = {}) => {
  const { search, grubosc, limit = 100, autoFetch = true } = options;
  
  const [plyty, setPlyty] = useState<Plyta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchPlyty = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (grubosc) params.append('grubosc', grubosc.toString());
      if (limit) params.append('limit', limit.toString());
      
      const url = `http://localhost:5000/api/plyty/active${params.toString() ? '?' + params.toString() : ''}`;
      
      console.log('Fetching plyty from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000 // 5 sekund timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Plyty API response:', data);
      
      if (data.success && data.data) {
        const plytyData = Array.isArray(data.data) ? data.data : [];
        setPlyty(plytyData);
        
        if (plytyData.length === 0) {
          console.warn('API zwrócił pustą listę płyt, używam fallback');
          setPlyty(FALLBACK_PLYTY);
          setUsingFallback(true);
        }
      } else {
        throw new Error(data.error || 'Nieoczekiwana struktura odpowiedzi API');
      }
      
    } catch (err: any) {
      console.error('Error fetching plyty:', err);
      setError(err.message);
      
      // Zawsze użyj fallback przy błędzie
      console.log('Używam fallback danych dla płyt');
      setPlyty(FALLBACK_PLYTY);
      setUsingFallback(true);
      
      message.warning('Nie można pobrać płyt z bazy - używam danych testowych');
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
    usingFallback,
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
      } else {
        // Fallback kolory
        const uniqueKolory = [...new Set(FALLBACK_PLYTY.map(p => p.kolor_nazwa))];
        setKolory(uniqueKolory.map(kolor => ({ kolor_nazwa: kolor })));
      }
    } catch (error) {
      console.error('Error fetching kolory:', error);
      // Fallback kolory
      const uniqueKolory = [...new Set(FALLBACK_PLYTY.map(p => p.kolor_nazwa))];
      setKolory(uniqueKolory.map(kolor => ({ kolor_nazwa: kolor })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKolory();
  }, []);

  return { kolory, loading, refetch: fetchKolory };
};
