import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@alp/theme';
import { ConfigProvider, App as AntApp } from 'antd';
import plPL from 'antd/es/locale/pl_PL';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { Router } from './router';

// Konfiguracja dayjs
dayjs.locale('pl');

// Konfiguracja React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minut
      gcTime: 1000 * 60 * 30, // 30 minut (dawniej cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ConfigProvider 
          locale={plPL}
          theme={{
            token: {
              colorPrimary: '#1890ff',
            },
          }}
          // KRYTYCZNE - wyłączamy virtual scroll w Select
          virtual={false}
          // Wymuszamy użycie portalu dla dropdown
          getPopupContainer={() => document.body}
        >
          <AntApp>
            <Router />
          </AntApp>
        </ConfigProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
