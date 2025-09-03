import { useQuery } from '@tanstack/react-query';

// Hook do pobierania szczegółowych danych ZKO ze statystykami
export const useZKOStats = (zkoId?: number) => {
  return useQuery({
    queryKey: ['zko', zkoId, 'stats'],
    queryFn: async () => {
      try {
        const endpoint = zkoId 
          ? `/api/zko/${zkoId}/stats` 
          : '/api/zko/stats';
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('ZKO Stats:', data);
        return data;
      } catch (error) {
        console.error('Error fetching ZKO stats:', error);
        throw error;
      }
    },
    enabled: zkoId ? !!zkoId && zkoId > 0 : true,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
  });
};

// Hook do pobierania sumy statystyk wszystkich ZKO
export const useZKOSummary = () => {
  return useQuery({
    queryKey: ['zko', 'summary'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/zko/summary', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('ZKO Summary:', data);
        return data;
      } catch (error) {
        console.error('Error fetching ZKO summary:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

// Hook do pobierania statystyk dla listy ZKO
export const useZKOListWithStats = (params?: {
  status?: string;
  kooperant?: string;
  priorytet?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['zko', 'list-with-stats', params],
    queryFn: async () => {
      try {
        const response = await fetch('/api/zko/list-with-stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('ZKO List with Stats:', data);
        return data;
      } catch (error) {
        console.error('Error fetching ZKO list with stats:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
  });
};
