import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@alp/theme';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { Router } from './router';

// WAŻNE: Import resetowania stylów Ant Design
import 'antd/dist/reset.css';

// Konfiguracja dayjs
dayjs.locale('pl');

// HACK: Tymczasowo wyłącz warningi dla findDOMNode
const originalError = console.error;
const originalWarn = console.warn;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('findDOMNode') || 
     args[0].includes('strokeWidth'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('findDOMNode') || 
     args[0].includes('strokeWidth'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Konfiguracja React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// BEZ React.StrictMode - może powodować problemy z Ant Design
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
