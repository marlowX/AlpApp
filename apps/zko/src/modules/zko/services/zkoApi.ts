// services/zkoApi.ts
// Serwis do komunikacji z API ZKO

import { message } from 'antd';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export interface DeletePozycjaResult {
  sukces: boolean;
  komunikat: string;
  usuniete_formatki: number;
  usuniete_palety: number;
}

export interface EditPozycjaData {
  rozkroj_id?: number;
  ilosc_plyt?: number;
  kolor_plyty?: string;
  nazwa_plyty?: string;
  kolejnosc?: number;
  uwagi?: string;
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
      const response = await fetch(`${API_BASE_URL}/zko/pozycje/${pozycjaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uzytkownik,
          powod,
          // Funkcja PostgreSQL do wywołania
          postgres_function: 'zko.usun_pozycje_zko'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Błąd podczas usuwania pozycji');
      }

      const result = await response.json();
      
      // Jeśli backend zwraca bezpośrednio wynik z PostgreSQL
      if (result.rows && result.rows[0]) {
        return result.rows[0];
      }
      
      // Jeśli backend przetwarza wynik
      return result;
      
    } catch (error) {
      console.error('Error deleting pozycja:', error);
      throw error;
    }
  }

  /**
   * Edytuje pozycję ZKO
   * TODO: Utworzyć funkcję w PostgreSQL: zko.edytuj_pozycje_zko
   */
  static async editPozycja(
    pozycjaId: number,
    data: EditPozycjaData,
    uzytkownik: string = 'system'
  ): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/zko/pozycje/${pozycjaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          uzytkownik,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Błąd podczas edycji pozycji');
      }

      return await response.json();
      
    } catch (error) {
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
      
    } catch (error) {
      console.error(`Error calling function ${functionName}:`, error);
      throw error;
    }
  }
}

// Eksport pomocniczych funkcji
export const zkoApi = {
  
  // Usuwanie pozycji z logiką biznesową w PostgreSQL
  deletePozycja: async (pozycjaId: number, uzytkownik?: string) => {
    const result = await ZKOApiService.deletePozycja(
      pozycjaId, 
      uzytkownik || 'system'
    );
    
    if (result.sukces) {
      message.success(result.komunikat);
    } else {
      message.error(result.komunikat);
    }
    
    return result;
  },

  // Edycja pozycji
  editPozycja: async (pozycjaId: number, data: EditPozycjaData) => {
    try {
      const result = await ZKOApiService.editPozycja(pozycjaId, data);
      message.success('Pozycja została zaktualizowana');
      return result;
    } catch (error: any) {
      message.error(error.message || 'Błąd podczas edycji pozycji');
      throw error;
    }
  },

  // Wywołanie funkcji PostgreSQL
  callFunction: async (functionName: string, ...params: any[]) => {
    return ZKOApiService.callPostgresFunction(`zko.${functionName}`, params);
  }
};

export default zkoApi;