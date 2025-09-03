import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@alp/theme';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { Router } from './router';

// WAŻNE: Import resetowania stylów Ant Design MUSI BYĆ PIERWSZY
import 'antd/dist/reset.css';
// Minimalne poprawki dla z-index
import './styles/antd-fixes.css';

// Konfiguracja dayjs
dayjs.locale('pl');

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
