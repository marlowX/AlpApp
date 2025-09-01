/**
 * @fileoverview Konfiguracja API dla modułu PaletyZko
 * @module PaletyZko/config
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  ENDPOINTS: {
    // ZKO
    ZKO_POZYCJE: (zkoId: number) => `/zko/${zkoId}/pozycje`,
    ZKO_PALETY: (zkoId: number) => `/zko/${zkoId}/palety`,
    
    // Pozycje
    POZYCJA_FORMATKI: (pozycjaId: number) => `/pozycje/${pozycjaId}/formatki`,
    
    // Palety - podstawowe
    PALETA_DETAILS: (paletaId: number) => `/palety/${paletaId}`,
    PALETA_HISTORIA: (paletaId: number) => `/palety/${paletaId}/historia`,
    PALETA_DELETE: (paletaId: number) => `/palety/${paletaId}`,
    PALETA_UPDATE: (paletaId: number) => `/palety/${paletaId}`,
    PALETA_ZAMKNIJ: (paletaId: number) => `/palety/${paletaId}/zamknij`,
    
    // Palety - ręczne tworzenie
    PALETA_CREATE_MANUAL: '/pallets/manual/create',
    PALETA_CREATE_BATCH: '/pallets/manual/batch',
    PALETA_AUTO_CREATE_REMAINING: '/pallets/manual/auto-remaining',
    
    // Palety - planowanie
    PALETA_PLAN_MODULAR: '/pallets/modular/plan',
    PALETA_PLAN_COLORS: '/pallets/modular/colors',
    PALETA_PLAN_V5: '/pallets/v5/plan',
    
    // Palety - zarządzanie
    PALETA_PRZENIES_FORMATKI: '/pallets/manage/move-formatki',
    PALETA_DELETE_ALL: (zkoId: number) => `/pallets/manage/${zkoId}/delete-all`,
    PALETA_REORGANIZE: '/pallets/manage/reorganize',
    
    // Palety - statystyki
    PALETA_STATS: (zkoId: number) => `/pallets/stats/${zkoId}`,
  }
};

// Domyślne wartości
export const DEFAULTS = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  REQUEST_TIMEOUT: 30000, // ms
  CACHE_DURATION: 5 * 60 * 1000, // 5 minut
};

// Mapowanie statusów HTTP na komunikaty
export const ERROR_MESSAGES = {
  400: 'Nieprawidłowe dane wejściowe',
  401: 'Brak autoryzacji',
  403: 'Brak uprawnień',
  404: 'Nie znaleziono zasobu',
  409: 'Konflikt danych - sprawdź powiązania',
  500: 'Błąd serwera - sprawdź logi',
  502: 'Serwer niedostępny',
  503: 'Usługa tymczasowo niedostępna',
};

// Helper do budowania URL z query params
export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  if (!params) return url;
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
    
  return queryString ? `${url}?${queryString}` : url;
};

// Helper do obsługi błędów API
export const handleApiError = (error: any): string => {
  if (error.response) {
    const status = error.response.status;
    const message = ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES];
    
    if (message) return message;
    
    if (error.response.data?.komunikat) {
      return error.response.data.komunikat;
    }
    
    if (error.response.data?.message) {
      return error.response.data.message;
    }
    
    return `Błąd HTTP ${status}`;
  }
  
  if (error.request) {
    return 'Brak odpowiedzi z serwera';
  }
  
  return error.message || 'Nieznany błąd';
};

// Helper do retry
export const retryRequest = async <T>(
  fn: () => Promise<T>,
  retries: number = DEFAULTS.MAX_RETRY_ATTEMPTS,
  delay: number = DEFAULTS.RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay * 2);
  }
};

// Axios interceptor config
export const setupAxiosInterceptors = (axios: any) => {
  // Request interceptor
  axios.interceptors.request.use(
    (config: any) => {
      // Dodaj timeout
      config.timeout = config.timeout || DEFAULTS.REQUEST_TIMEOUT;
      
      // Dodaj timestamp do query params (cache busting)
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now()
        };
      }
      
      return config;
    },
    (error: any) => Promise.reject(error)
  );
  
  // Response interceptor
  axios.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      const originalRequest = error.config;
      
      // Retry dla błędów sieciowych
      if (!error.response && !originalRequest._retry) {
        originalRequest._retry = true;
        return axios(originalRequest);
      }
      
      return Promise.reject(error);
    }
  );
};

export default API_CONFIG;
