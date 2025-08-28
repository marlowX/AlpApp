import { useState, useEffect } from 'react';
import { message } from 'antd';
import type { Rozkroj } from '../components/AddPozycja/types';

interface UseRozkrojeOptions {
  autoFetch?: boolean;
  includeFormatki?: boolean;
}

export const useRozkroje = (options: UseRozkrojeOptions = {}) => {
  const { autoFetch = true, includeFormatki = true } = options;
  
  const [rozkroje, setRozkroje] = useState<Rozkroj[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRozkroje = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/rozkroje');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const rozkrojeData = await response.json();
      
      let finalRozkroje;
      
      if (includeFormatki) {
        // Pobierz formatki dla każdego rozkroju
        finalRozkroje = await Promise.all(
          rozkrojeData.map(async (rozkroj: any) => {
            try {
              const formatkiResponse = await fetch(
                `http://localhost:5000/api/rozkroje/${rozkroj.id}/formatki`
              );
              const formatkiData = formatkiResponse.ok ? 
                await formatkiResponse.json() : [];
              return { ...rozkroj, formatki: formatkiData };
            } catch (error) {
              console.warn(`Błąd pobierania formatek dla rozkroju ${rozkroj.id}:`, error);
              return { ...rozkroj, formatki: [] };
            }
          })
        );
      } else {
        finalRozkroje = rozkrojeData.map((r: any) => ({ ...r, formatki: [] }));
      }
      
      setRozkroje(finalRozkroje);
      
    } catch (err: any) {
      console.error('Error fetching rozkroje:', err);
      setError(err.message);
      message.error('Błąd podczas pobierania rozkrojów');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchRozkroje();
    }
  }, [autoFetch, includeFormatki]);

  return {
    rozkroje,
    loading,
    error,
    refetch: fetchRozkroje,
    // Pomocne funkcje
    getRozkrojById: (id: number) => rozkroje.find(r => r.id === id),
    getRozkrojeBySize: (rozmiar: string) => 
      rozkroje.filter(r => r.rozmiar_plyty === rozmiar),
    searchRozkroje: (query: string) => 
      rozkroje.filter(r => 
        r.kod_rozkroju.toLowerCase().includes(query.toLowerCase()) ||
        r.opis.toLowerCase().includes(query.toLowerCase())
      )
  };
};
