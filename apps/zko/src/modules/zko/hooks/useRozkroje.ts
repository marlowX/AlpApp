import { useState, useEffect } from 'react';
import { message } from 'antd';
import type { Rozkroj } from '../components/AddPozycja/types';

interface UseRozkrojeOptions {
  autoFetch?: boolean;
  includeFormatki?: boolean;
}

// Fallback data gdy API nie działa
const FALLBACK_ROZKROJE: Rozkroj[] = [
  {
    id: 1,
    kod_rozkroju: 'rozk-0001',
    opis: '800x300, 600x300, 400x300',
    rozmiar_plyty: '2800x2070',
    typ_plyty: 'laminat',
    formatki: [
      { nazwa_formatki: '800x300', dlugosc: 800, szerokosc: 300, ilosc_sztuk: 8, typ_plyty: 'laminat' },
      { nazwa_formatki: '600x300', dlugosc: 600, szerokosc: 300, ilosc_sztuk: 8, typ_plyty: 'laminat' },
      { nazwa_formatki: '400x300', dlugosc: 400, szerokosc: 300, ilosc_sztuk: 12, typ_plyty: 'laminat' }
    ]
  },
  {
    id: 2,
    kod_rozkroju: 'rozk-0002',
    opis: '1200x400, 800x400',
    rozmiar_plyty: '2800x2070',
    typ_plyty: 'laminat',
    formatki: [
      { nazwa_formatki: '1200x400', dlugosc: 1200, szerokosc: 400, ilosc_sztuk: 4, typ_plyty: 'laminat' },
      { nazwa_formatki: '800x400', dlugosc: 800, szerokosc: 400, ilosc_sztuk: 6, typ_plyty: 'laminat' }
    ]
  },
  {
    id: 6,
    kod_rozkroju: 'rozk-0006',
    opis: '760x280, 390x280',
    rozmiar_plyty: '2800x2070',
    typ_plyty: 'laminat',
    formatki: [
      { nazwa_formatki: '760x280', dlugosc: 760, szerokosc: 280, ilosc_sztuk: 7, typ_plyty: 'laminat' },
      { nazwa_formatki: '390x280', dlugosc: 390, szerokosc: 280, ilosc_sztuk: 14, typ_plyty: 'laminat' }
    ]
  },
  {
    id: 20,
    kod_rozkroju: 'rozk-0020',
    opis: '262x279, 462x279, 562x279',
    rozmiar_plyty: '2800x2070',
    typ_plyty: 'laminat',
    formatki: [
      { nazwa_formatki: '262x279', dlugosc: 262, szerokosc: 279, ilosc_sztuk: 28, typ_plyty: 'laminat' },
      { nazwa_formatki: '462x279', dlugosc: 462, szerokosc: 279, ilosc_sztuk: 7, typ_plyty: 'laminat' },
      { nazwa_formatki: '562x279', dlugosc: 562, szerokosc: 279, ilosc_sztuk: 14, typ_plyty: 'laminat' }
    ]
  }
];

export const useRozkroje = (options: UseRozkrojeOptions = {}) => {
  const { autoFetch = true, includeFormatki = true } = options;
  
  const [rozkroje, setRozkroje] = useState<Rozkroj[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchRozkroje = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      
      // ZMIANA: Teraz używamy zko-service endpoint
      console.log('Fetching rozkroje from ZKO-SERVICE: http://localhost:5000/api/rozkroje');
      
      const response = await fetch('http://localhost:5000/api/rozkroje', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Rozkroje ZKO-SERVICE response:', data);
      
      // ZKO-SERVICE może zwracać dane w innym formacie
      let rozkrojeData = Array.isArray(data) ? data : (data.data || data.rows || []);
      
      if (rozkrojeData.length === 0) {
        console.warn('ZKO-SERVICE zwrócił pustą listę rozkrojów, używam fallback');
        setRozkroje(FALLBACK_ROZKROJE);
        setUsingFallback(true);
        return;
      }
      
      let finalRozkroje;
      
      if (includeFormatki) {
        // Pobierz formatki dla każdego rozkroju z ZKO-SERVICE
        finalRozkroje = await Promise.all(
          rozkrojeData.map(async (rozkroj: any) => {
            try {
              console.log(`Fetching formatki for rozkroj ${rozkroj.id} from ZKO-SERVICE`);
              
              const formatkiResponse = await fetch(
                `http://localhost:5000/api/rozkroje/${rozkroj.id}/formatki`
              );
              
              if (formatkiResponse.ok) {
                const formatkiData = await formatkiResponse.json();
                // ZKO-SERVICE może zwracać formatki w różnym formacie
                const formatki = Array.isArray(formatkiData) ? 
                  formatkiData : (formatkiData.data || formatkiData.rows || []);
                
                return { ...rozkroj, formatki };
              } else {
                console.warn(`Błąd pobierania formatek dla rozkroju ${rozkroj.id} z ZKO-SERVICE`);
                return { ...rozkroj, formatki: [] };
              }
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
      console.error('Error fetching rozkroje from ZKO-SERVICE:', err);
      setError(err.message);
      
      // Zawsze użyj fallback przy błędzie
      console.log('Używam fallback danych dla rozkrojów');
      setRozkroje(FALLBACK_ROZKROJE);
      setUsingFallback(true);
      
      message.warning('Nie można pobrać rozkrojów z ZKO-SERVICE - używam danych testowych');
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
    usingFallback,
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
