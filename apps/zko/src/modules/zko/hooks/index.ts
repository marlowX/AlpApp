import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { zkoApi } from '../api';
import type { ZKO, CreateZKODto, ChangeStatusDto } from '../types';

// Export hooks dla płyt i rozkrojów - teraz używają ZKO-SERVICE
export { usePlyty, useKoloryPlyty } from './usePlyty';
export { useRozkroje } from './useRozkroje';

// Hook do pobierania listy ZKO - ZKO-SERVICE endpoint
export const useZKOList = (params?: {
  status?: string;
  kooperant?: string;
  priorytet?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['zko', 'list', params],
    queryFn: async () => {
      try {
        // ZMIANA: Używamy ZKO-SERVICE endpoint
        const response = await fetch('http://localhost:5000/api/zko', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('ZKO-SERVICE data:', data); // Debug log
        
        // ZKO-SERVICE może zwracać dane w innym formacie
        return Array.isArray(data) ? data : (data.data || data.rows || data);
      } catch (error) {
        console.error('Error fetching ZKO from ZKO-SERVICE:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });
};

// Hook do pobierania szczegółów ZKO z pozycjami i paletami - ZKO-SERVICE
export const useZKO = (id: number) => {
  return useQuery({
    queryKey: ['zko', id],
    queryFn: async () => {
      try {
        // ZMIANA: Używamy ZKO-SERVICE endpoint
        const response = await fetch(`http://localhost:5000/api/zko/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('ZKO nie zostało znalezione');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('ZKO-SERVICE details with pozycje:', data);
        return data;
      } catch (error) {
        console.error('Error fetching ZKO details from ZKO-SERVICE:', error);
        throw error;
      }
    },
    enabled: !!id && id > 0,
    retry: 1,
  });
};

// Hook do tworzenia ZKO
export const useCreateZKO = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (dto: CreateZKODto) => zkoApi.create(dto),
    onSuccess: (data) => {
      message.success(data.komunikat || 'ZKO utworzone pomyślnie');
      queryClient.invalidateQueries({ queryKey: ['zko', 'list'] });
    },
    onError: (error: any) => {
      console.error('Create ZKO error:', error);
      message.error(error.response?.data?.message || error.message || 'Błąd podczas tworzenia ZKO');
    },
  });
};

// Hook do zmiany statusu
export const useChangeStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (dto: ChangeStatusDto) => zkoApi.changeStatus(dto),
    onSuccess: (data, variables) => {
      message.success(data.komunikat || 'Status zmieniony pomyślnie');
      queryClient.invalidateQueries({ queryKey: ['zko', variables.zko_id] });
      queryClient.invalidateQueries({ queryKey: ['zko', 'list'] });
    },
    onError: (error: any) => {
      console.error('Change status error:', error);
      message.error(error.response?.data?.message || error.message || 'Błąd podczas zmiany statusu');
    },
  });
};

// Hook do pobierania następnych kroków workflow - ZKO-SERVICE
export const useNextSteps = (zkoId: number) => {
  return useQuery({
    queryKey: ['zko', zkoId, 'next-steps'],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/workflow/next-steps/${zkoId}`);
      if (!response.ok) throw new Error('Failed to fetch next steps');
      return response.json();
    },
    enabled: !!zkoId,
    retry: 1,
  });
};

// Hook do pobierania instrukcji workflow - ZKO-SERVICE
export const useWorkflowInstructions = () => {
  return useQuery({
    queryKey: ['workflow', 'instructions'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/workflow/instructions');
      if (!response.ok) throw new Error('Failed to fetch workflow instructions');
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 godzina
  });
};

// Hook do planowania palet - ZKO-SERVICE
export const usePlanPallets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ pozycjaId, params }: { 
      pozycjaId: number; 
      params?: {
        max_wysokosc_cm?: number;
        max_waga_kg?: number;
        grubosc_mm?: number;
      }
    }) => {
      const response = await fetch('http://localhost:5000/api/pallets/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pozycja_id: pozycjaId,
          ...params
        })
      });
      if (!response.ok) throw new Error('Failed to plan pallets');
      return response.json();
    },
    onSuccess: (data) => {
      message.success(data.komunikat || 'Palety zaplanowane pomyślnie');
      queryClient.invalidateQueries({ queryKey: ['zko'] });
    },
    onError: (error: any) => {
      message.error('Błąd podczas planowania palet');
    },
  });
};

// Hook do zamykania palety - ZKO-SERVICE
export const useClosePallet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ paletaId, operator, uwagi }: {
      paletaId: number;
      operator?: string;
      uwagi?: string;
    }) => {
      const response = await fetch(`http://localhost:5000/api/pallets/${paletaId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator, uwagi })
      });
      if (!response.ok) throw new Error('Failed to close pallet');
      return response.json();
    },
    onSuccess: (data) => {
      message.success(data.komunikat || 'Paleta zamknięta pomyślnie');
      queryClient.invalidateQueries({ queryKey: ['zko'] });
      queryClient.invalidateQueries({ queryKey: ['pallets'] });
    },
    onError: (error: any) => {
      message.error('Błąd podczas zamykania palety');
    },
  });
};

// Hook do raportowania produkcji - ZKO-SERVICE
export const useReportProduction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      pozycja_id: number;
      formatka_id: number;
      ilosc_ok: number;
      ilosc_uszkodzona?: number;
      operator?: string;
      uwagi?: string;
    }) => {
      const response = await fetch('http://localhost:5000/api/production/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Failed to report production');
      return response.json();
    },
    onSuccess: (data) => {
      message.success(data.komunikat || 'Produkcja zaraportowana');
      queryClient.invalidateQueries({ queryKey: ['zko'] });
    },
    onError: (error: any) => {
      message.error('Błąd podczas raportowania produkcji');
    },
  });
};

// Hook do zgłaszania uszkodzeń - ZKO-SERVICE  
export const useReportDamage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      zko_id: number;
      formatka_id?: number;
      formatka_typ?: string;
      ilosc: number;
      etap: string;
      typ_uszkodzenia: string;
      opis?: string;
      operator?: string;
      mozna_naprawic?: boolean;
    }) => {
      const response = await fetch('http://localhost:5000/api/production/damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Failed to report damage');
      return response.json();
    },
    onSuccess: (data) => {
      message.warning(data.komunikat || 'Uszkodzenie zgłoszone');
      queryClient.invalidateQueries({ queryKey: ['zko'] });
    },
    onError: (error: any) => {
      message.error('Błąd podczas zgłaszania uszkodzenia');
    },
  });
};

// Hook do kończenia zlecenia - ZKO-SERVICE
export const useCompleteZKO = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ zkoId, operator, komentarz }: {
      zkoId: number;
      operator?: string;
      komentarz?: string;
    }) => {
      const response = await fetch(`http://localhost:5000/api/zko/${zkoId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator, komentarz })
      });
      if (!response.ok) throw new Error('Failed to complete ZKO');
      return response.json();
    },
    onSuccess: (data) => {
      message.success(data.komunikat || 'Zlecenie zakończone');
      queryClient.invalidateQueries({ queryKey: ['zko'] });
    },
    onError: (error: any) => {
      message.error('Błąd podczas kończenia zlecenia');
    },
  });
};

// Hook do usuwania ZKO
export const useDeleteZKO = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (zkoId: number) => zkoApi.delete(zkoId),
    onSuccess: (data) => {
      message.success(data.komunikat || 'ZKO usunięte');
      queryClient.invalidateQueries({ queryKey: ['zko', 'list'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Błąd podczas usuwania ZKO');
    },
  });
};

// Hook do pobierania stanu bufora - ZKO-SERVICE
export const useBufferStatus = () => {
  return useQuery({
    queryKey: ['buffer', 'okleiniarka'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/buffer/okleiniarka/status');
      if (!response.ok) throw new Error('Failed to fetch buffer status');
      return response.json();
    },
    refetchInterval: 30000, // Odświeżaj co 30 sekund
  });
};
