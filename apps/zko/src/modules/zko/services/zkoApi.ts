// services/zkoApi.ts
// Serwis do komunikacji z API ZKO

import { message } from 'antd';

// W Vite używamy import.meta.env zamiast process.env
// Proxy w vite.config.ts przekierowuje /api na backend
const API_BASE_URL = '/api';

export interface DeletePozycjaResult {
  sukces: boolean;
  komunikat: string;
  usuniete_formatki?: number;
  usuniete_palety?: number;
}

export interface EditPozycjaData {
  rozkroj_id?: number;
  ilosc_plyt?: number;
  kolor_plyty?: string;
  nazwa_plyty?: string;
  kolejnosc?: number;
  uwagi?: string;
  sciezka_produkcji?: string;
}

export interface EditPozycjaResult {
  sukces: boolean;
  komunikat: string;
  pozycja?: any;
}

export class ZKOApiService {
  
  /**
   * Usuwa pozycję ZKO używając funkcji PostgreSQL
   * Wywołuje: zko.usun_pozycje_zko(pozycja_id, uzytkownik, powod)
   */
  static async deletePozycja(
    pozycjaId: number, 
    uzytkownik: string = 'system',
    powod?: string
  ): Promise<DeletePozycjaResult> {
    try {
      // Budujemy body tylko jeśli mamy dane
      const requestBody = uzytkownik !== 'system' || powod 
        ? { uzytkownik, powod }
        : undefined;
      
      const response = await fetch(`${API_BASE_URL}/zko/pozycje/${pozycjaId}`, {
        method: 'DELETE',
        headers: requestBody ? { 'Content-Type': 'application/json' } : {},
        body: requestBody ? JSON.stringify(requestBody) : undefined
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Nieznany błąd' }));
        throw new Error(errorData.komunikat || errorData.error || 'Błąd podczas usuwania pozycji');
      }

      const result = await response.json();
      
      // Backend zwraca bezpośrednio rozpakowany JSONB z funkcji PostgreSQL
      return result;
      
    } catch (error: any) {
      console.error('Error deleting pozycja:', error);
      throw error;
    }
  }

  /**
   * Edytuje pozycję ZKO używając funkcji PostgreSQL
   * Wywołuje: zko.edytuj_pozycje_zko(pozycja_id, ...)
   */
  static async editPozycja(
    pozycjaId: number,
    data: EditPozycjaData
  ): Promise<EditPozycjaResult> {
    try {
      // Dodaj domyślną ścieżkę produkcji jeśli nie podano
      const requestData = {
        ...data,
        sciezka_produkcji: data.sciezka_produkcji || 'CIECIE->OKLEJANIE->MAGAZYN'
      };
      
      const response = await fetch(`${API_BASE_URL}/zko/pozycje/${pozycjaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Nieznany błąd' }));
        throw new Error(errorData.komunikat || errorData.error || 'Błąd podczas edycji pozycji');
      }

      const result = await response.json();
      
      // Backend zwraca obiekt z polami: sukces, komunikat, pozycja
      return result;
      
    } catch (error: any) {
      console.error('Error editing pozycja:', error);
      throw error;
    }
  }

  /**
   * Wywołuje dowolną funkcję PostgreSQL ze schematu zko
   */
  static async callPostgresFunction(
    functionName: string,
    params: any[] = []
  ): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/zko/functions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function: functionName,
          params: params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Błąd podczas wywołania funkcji ${functionName}`);
      }

      return await response.json();
      
    } catch (error: any) {
      console.error(`Error calling function ${functionName}:`, error);
      throw error;
    }
  }
}

// Eksport pomocniczych funkcji
export const zkoApi = {
  
  // Usuwanie pozycji z logiką biznesową w PostgreSQL
  deletePozycja: async (pozycjaId: number, uzytkownik?: string): Promise<DeletePozycjaResult> => {
    try {
      const result = await ZKOApiService.deletePozycja(
        pozycjaId, 
        uzytkownik || 'system'
      );
      
      if (result.sukces) {
        message.success(result.komunikat || 'Pozycja została usunięta');
      } else {
        message.error(result.komunikat || 'Nie udało się usunąć pozycji');
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Błąd podczas usuwania pozycji';
      message.error(errorMessage);
      // Zwracamy obiekt błędu w odpowiednim formacie
      return {
        sukces: false,
        komunikat: errorMessage
      };
    }
  },

  // Edycja pozycji
  editPozycja: async (pozycjaId: number, data: EditPozycjaData): Promise<EditPozycjaResult> => {
    try {
      const result = await ZKOApiService.editPozycja(pozycjaId, data);
      
      if (result.sukces) {
        message.success(result.komunikat || 'Pozycja została zaktualizowana');
      } else {
        message.error(result.komunikat || 'Nie udało się zaktualizować pozycji');
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Błąd podczas edycji pozycji';
      message.error(errorMessage);
      // Zwracamy obiekt błędu w odpowiednim formacie
      return {
        sukces: false,
        komunikat: errorMessage
      };
    }
  },

  // Wywołanie funkcji PostgreSQL
  callFunction: async (functionName: string, ...params: any[]) => {
    return ZKOApiService.callPostgresFunction(`zko.${functionName}`, params);
  }
};

export default zkoApi;
