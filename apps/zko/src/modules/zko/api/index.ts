import axios from 'axios';
import type { 
  ZKO, 
  CreateZKODto, 
  AddPozycjaDto, 
  ChangeStatusDto,
  WorkflowStep 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Instancja axios z konfiguracją
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor dla autoryzacji
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions
export const zkoApi = {
  // Lista ZKO z filtrowaniem
  getList: async (params?: {
    status?: string;
    kooperant?: string;
    priorytet?: number;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await apiClient.get<{ data: ZKO[]; total: number }>('/zko', { params });
    return data;
  },

  // Szczegóły ZKO
  getById: async (id: number) => {
    const { data } = await apiClient.get<ZKO>(`/zko/${id}`);
    return data;
  },

  // Tworzenie nowego ZKO
  create: async (dto: CreateZKODto) => {
    const { data } = await apiClient.post<{
      sukces: boolean;
      zko_id: number;
      numer_zko: string;
      komunikat: string;
    }>('/zko/create', dto);
    return data;
  },

  // Dodawanie pozycji do ZKO
  addPozycja: async (dto: AddPozycjaDto) => {
    const { data } = await apiClient.post<{
      pozycja_id: number;
      formatki_dodane: number;
      komunikat: string;
    }>('/zko/pozycje/add', dto);
    return data;
  },

  // Zmiana statusu/etapu
  changeStatus: async (dto: ChangeStatusDto) => {
    const { data } = await apiClient.post<{
      sukces: boolean;
      komunikat: string;
      stary_status: string;
      nowy_status: string;
      etap_nazwa: string;
    }>('/zko/status/change', dto);
    return data;
  },

  // Pobranie następnych możliwych kroków
  getNextSteps: async (zkoId: number) => {
    const { data } = await apiClient.get<{
      kod_etapu: string;
      nazwa: string;
      kolejnosc: number;
      czy_dostepny: boolean;
      komunikat: string;
    }[]>(`/zko/${zkoId}/next-steps`);
    return data;
  },

  // Pobranie instrukcji workflow
  getWorkflowInstructions: async () => {
    const { data } = await apiClient.get<WorkflowStep[]>('/zko/workflow/instructions');
    return data;
  },

  // Status zlecenia
  getStatus: async (zkoId: number) => {
    const { data } = await apiClient.get<{
      zko_info: any;
      obecny_etap: string;
      nastepne_kroki: any;
      palety: any;
      pozycje: any;
    }>(`/zko/${zkoId}/status`);
    return data;
  },

  // Planowanie palet
  planPallets: async (pozycjaId: number, params?: {
    max_wysokosc_cm?: number;
    max_waga_kg?: number;
    grubosc_mm?: number;
  }) => {
    const { data } = await apiClient.post<{
      sukces: boolean;
      komunikat: string;
      palety_utworzone: number[];
      plan_szczegolowy: any;
    }>('/zko/palety/plan', {
      pozycja_id: pozycjaId,
      ...params
    });
    return data;
  },

  // Zamknięcie palety
  closePallet: async (paletaId: number, operator?: string, uwagi?: string) => {
    const { data } = await apiClient.post<{
      sukces: boolean;
      komunikat: string;
      paleta_info: any;
    }>(`/zko/palety/${paletaId}/close`, { operator, uwagi });
    return data;
  },

  // Przyjęcie na bufor okleiniarki
  acceptToBuffer: async (paletaId: number, params: {
    miejsce_numer?: string;
    operator?: string;
    priorytet?: number;
    uwagi?: string;
  }) => {
    const { data } = await apiClient.post<{
      sukces: boolean;
      komunikat: string;
      miejsce_id: number;
      miejsce_numer: string;
      info_bufora: any;
    }>('/zko/buffer/okleiniarka/accept', {
      paleta_id: paletaId,
      ...params
    });
    return data;
  },

  // Stan bufora
  getBufferStatus: async () => {
    const { data } = await apiClient.get<{
      numer_miejsca: string;
      sektor: string;
      status: string;
      paleta_numer: string;
      kolory: string;
      ilosc_sztuk: number;
      czas_oczekiwania: string;
      priorytet: number;
    }[]>('/zko/buffer/okleiniarka/status');
    return data;
  },

  // Raportowanie produkcji
  reportProduction: async (params: {
    pozycja_id: number;
    formatka_id: number;
    ilosc_ok: number;
    ilosc_uszkodzona?: number;
    operator?: string;
    uwagi?: string;
  }) => {
    const { data } = await apiClient.post<{
      sukces: boolean;
      komunikat: string;
      formatka_info: string;
      procent_wykonania: number;
    }>('/zko/production/report', params);
    return data;
  },

  // Zgłoszenie uszkodzenia
  reportDamage: async (params: {
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
    const { data } = await apiClient.post<{
      sukces: boolean;
      uszkodzenie_id: number;
      komunikat: string;
      formatka_info: any;
    }>('/zko/damage/report', params);
    return data;
  },

  // Zakończenie zlecenia
  complete: async (zkoId: number, operator?: string, komentarz?: string) => {
    const { data } = await apiClient.post<{
      sukces: boolean;
      komunikat: string;
      podsumowanie: any;
    }>(`/zko/${zkoId}/complete`, { operator, komentarz });
    return data;
  },

  // Usunięcie ZKO
  delete: async (zkoId: number) => {
    const { data } = await apiClient.delete<{
      sukces: boolean;
      komunikat: string;
      usuniete_pozycje: number;
      usuniete_formatki: number;
    }>(`/zko/${zkoId}`);
    return data;
  },
};

export default zkoApi;