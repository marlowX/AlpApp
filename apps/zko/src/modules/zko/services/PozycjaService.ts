import { notification } from 'antd';
import type { KolorPlyty } from '../components/AddPozycja/types';

interface AddPozycjaRequest {
  zko_id: number;
  rozkroj_id: number;
  kolory_plyty: KolorPlyty[];
  kolejnosc?: number | null;
  uwagi?: string | null;
  sciezka_produkcji?: string;
}

interface AddPozycjaResponse {
  sukces: boolean;
  pozycje_ids?: number[];
  komunikat?: string;
  formatki_dodane?: number;
  error?: string;
  details?: any;
}

export class PozycjaService {
  static async addPozycja(data: AddPozycjaRequest): Promise<AddPozycjaResponse> {
    try {
      console.log('📤 Wysyłanie danych:', data);
      
      // Dodaj domyślną ścieżkę produkcji jeśli nie podano
      const requestData = {
        ...data,
        sciezka_produkcji: data.sciezka_produkcji || 'CIECIE->OKLEJANIE->MAGAZYN'
      };
      
      const response = await fetch('/api/zko/pozycje/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        this.handleApiError(response.status, result);
        throw new Error(result.error || `Błąd HTTP ${response.status}`);
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Error adding pozycja:', error);
      
      if (error.message === 'Failed to fetch') {
        notification.error({
          message: 'Błąd połączenia',
          description: 'Nie można połączyć się z serwerem. Sprawdź czy backend działa na porcie 5000.',
          duration: 6,
        });
      }
      
      throw error;
    }
  }

  private static handleApiError(status: number, result: any): void {
    if (status === 400 && result.details) {
      // Błędy walidacji z Zod
      const zodErrors = result.details.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      notification.error({
        message: 'Błąd walidacji danych',
        description: `Backend odrzucił dane:\n${zodErrors.join('\n')}`,
        duration: 8,
      });
    } else if (status === 500) {
      // Błąd serwera
      const errorDetails = [
        result.error || 'Wystąpił błąd podczas dodawania pozycji',
        '',
        'Możliwe przyczyny:',
        '• Funkcja PostgreSQL nie istnieje w schemacie zko',
        '• Nieprawidłowe parametry funkcji',
        '• Problem z połączeniem do bazy danych'
      ].join('\n');
      
      notification.error({
        message: 'Błąd serwera',
        description: errorDetails,
        duration: 10,
      });
    }
  }

  static showSuccessNotification(result: AddPozycjaResponse): void {
    const details: string[] = [
      result.komunikat || 'Pozycja została dodana pomyślnie'
    ];
    
    if (result.pozycje_ids) {
      details.push(`ID pozycji: ${result.pozycje_ids.join(', ')}`);
    }
    
    if (result.formatki_dodane) {
      details.push(`Formatek do produkcji: ${result.formatki_dodane}`);
    }
    
    notification.success({
      message: 'Sukces!',
      description: details.join('\n'),
      duration: 5,
    });
  }
}
