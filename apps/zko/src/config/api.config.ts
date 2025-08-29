// Przykład używania zmiennych środowiskowych w Vite
// NIE używaj process.env - to nie działa w Vite!

// ❌ ŹLE - nie działa w Vite
// const apiUrl = process.env.REACT_APP_API_URL;

// ✅ DOBRZE - używaj import.meta.env
// const apiUrl = import.meta.env.VITE_API_URL;

// Dla naszej aplikacji ZKO używamy proxy, więc:
export const API_CONFIG = {
  // Proxy w vite.config.ts przekierowuje /api na backend
  baseURL: '/api',
  
  // Jeśli potrzebujesz zmiennych środowiskowych:
  appTitle: import.meta.env.VITE_APP_TITLE || 'ZKO System',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Tryb development/production
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Eksportuj konfigurację
export default API_CONFIG;