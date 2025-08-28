import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { zkoApi } from '../api';
import type { ZKO, CreateZKODto, ChangeStatusDto } from '../types';

// Export hooks dla płyt i rozkrojów
export { usePlyty, useKoloryPlyty } from './usePlyty';
export { useRozkroje } from './useRozkroje';

// Hook do pobierania listy ZKO
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
        console.log('ZKO data:', data); // Debug log
        return data;
      } catch (error) {
        console.error('Error fetching ZKO:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });
};

// Hook do pobierania szczegółów ZKO z pozycjami i paletami
export const useZKO = (id: number) => {
  return useQuery({
    queryKey: ['zko', id],
    queryFn: async () => {
      try {
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
        console.log('ZKO details with pozycje:', data);
        return data;
      } catch (error) {
        console.error('Error fetching ZKO details:', error);
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

// Hook do pobierania następnych kroków workflow
export const useNextSteps = (zkoId: number) => {
  return useQuery({
    queryKey: ['zko', zkoId, 'next-steps'],
    queryFn: () => zkoApi.getNextSteps(zkoId),
    enabled: !!zkoId,
    retry: 1,
  });
};

// Hook do pobierania instrukcji workflow
export const useWorkflowInstructions = () => {
  return useQuery({
    queryKey: ['workflow', 'instructions'],
    queryFn: () => zkoApi.getWorkflowInstructions(),
    staleTime: 1000 * 60 * 60, // 1 godzina
  });
};

// Hook do planowania palet
export const usePlanPallets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ pozycjaId, params }: { 
      pozycjaId: number; 
      params?: {
        max_wysokosc_cm?: number;
        max_waga_kg?: number;
        grubosc_mm?: number;
      }
    }) => zkoApi.planPallets(pozycjaId, params),
    onSuccess: (data) => {
      message.success(data.komunikat || 'Palety zaplanowane pomyślnie');
      queryClient.invalidateQueries({ queryKey: ['zko'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Błąd podczas planowania palet');
    },
  });
};

// Hook do zamykania palety
export const useClosePallet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ paletaId, operator, uwagi }: {
      paletaId: number;
      operator?: string;
      uwagi?: string;
    }) => zkoApi.closePallet(paletaId, operator, uwagi),
    onSuccess: (data) => {
      message.success(data.komunikat || 'Paleta zamknięta pomyślnie');
      queryClient.invalidateQueries({ queryKey: ['zko'] });
      queryClient.invalidateQueries({ queryKey: ['pallets'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Błąd podczas zamykania palety');
    },
  });
};

// Hook do raportowania produkcji
export const useReportProduction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: zkoApi.reportProduction,
    onSuccess: (data) => {
      message.success(data.komunikat || 'Produkcja zaraportowana');
      queryClient.invalidateQueries({ queryKey: ['zko'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Błąd podczas raportowania produkcji');
    },
  });
};

// Hook do zgłaszania uszkodzeń
export const useReportDamage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: zkoApi.reportDamage,
    onSuccess: (data) => {
      message.warning(data.komunikat || 'Uszkodzenie zgłoszone');
      queryClient.invalidateQueries({ queryKey: ['zko'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Błąd podczas zgłaszania uszkodzenia');
    },
  });
};

// Hook do kończenia zlecenia
export const useCompleteZKO = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ zkoId, operator, komentarz }: {
      zkoId: number;
      operator?: string;
      komentarz?: string;
    }) => zkoApi.complete(zkoId, operator, komentarz),
    onSuccess: (data) => {
      message.success(data.komunikat || 'Zlecenie zakończone');
      queryClient.invalidateQueries({ queryKey: ['zko'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Błąd podczas kończenia zlecenia');
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

// Hook do pobierania stanu bufora
export const useBufferStatus = () => {
  return useQuery({
    queryKey: ['buffer', 'okleiniarka'],
    queryFn: () => zkoApi.getBufferStatus(),
    refetchInterval: 30000, // Odświeżaj co 30 sekund
  });
};
