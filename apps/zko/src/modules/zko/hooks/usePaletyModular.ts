// hooks/usePaletyModular.ts
import { useState } from 'react';

interface PlanowanieModularneParams {
  max_wysokosc_mm?: number;
  max_formatek_na_palete?: number;
  nadpisz_istniejace?: boolean;
  operator?: string;
}

interface FormatkaSzczegol {
  formatka_id: number;
  ilosc: number;
  nazwa: string;
}

interface PaletaSzczegol {
  id: number;
  numer_palety: string;
  sztuk_total: number;
  wysokosc_stosu: number;
  waga_kg: number;
  formatki_szczegoly: FormatkaSzczegol[];
}

interface PlanowanieModularneResponse {
  sukces: boolean;
  komunikat: string;
  palety_utworzone: number[];
  palety_szczegoly: PaletaSzczegol[];
  statystyki: {
    palety_utworzone: number;
    sztuk_total: number;
    typy_formatek: number;
    sztuk_na_palete: number;
  };
  formatki_info: {
    typy_formatek: number;
    total_sztuk: number;
  };
  wersja: string;
}

interface CheckQuantitiesResponse {
  sukces: boolean;
  zgodnosc_ilosci: boolean;
  podsumowanie: {
    zko: {
      typy_formatek: number;
      total_sztuk: number;
    };
    palety: {
      liczba_palet: number;
      total_sztuk: number;
    };
    tabela_ilosc: {
      wpisy: number;
      total_sztuk: number;
    };
  };
  zgodnosc: {
    zko_vs_palety: boolean;
    palety_vs_ilosc: boolean;
    tabela_ilosc_wypelniona: boolean;
  };
  status: 'OK' | 'NEEDS_FIX';
}

export const usePaletyModular = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * NOWE PLANOWANIE MODULARICZNE - POPRAWNE Z ILOŚCIAMI
   */
  const planujModularnie = async (
    zkoId: number, 
    params: PlanowanieModularneParams = {}
  ): Promise<PlanowanieModularneResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/pallets/zko/${zkoId}/plan-modular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_wysokosc_mm: 1440,
          max_formatek_na_palete: 80,
          nadpisz_istniejace: false,
          operator: 'user',
          ...params
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.sukces) {
        throw new Error(data.komunikat || 'Planowanie nie powiodło się');
      }

      console.log('✅ Planowanie modulariczne sukces:', {
        palety: data.palety_utworzone?.length || 0,
        sztuki_total: data.formatki_info?.total_sztuk || 0,
        wersja: data.wersja
      });

      return data;
      
    } catch (err: any) {
      const errorMsg = err.message || 'Błąd planowania modularycznego';
      setError(errorMsg);
      console.error('❌ Błąd planowania modularycznego:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * SPRAWDZENIE POPRAWNOŚCI ILOŚCI
   */
  const sprawdzIlosci = async (zkoId: number): Promise<CheckQuantitiesResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/pallets/zko/${zkoId}/check-quantities`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log('📊 Sprawdzenie ilości:', {
        status: data.status,
        zgodnosc: data.zgodnosc_ilosci,
        zko_sztuk: data.podsumowanie?.zko?.total_sztuk,
        palety_sztuk: data.podsumowanie?.palety?.total_sztuk,
        tabela_sztuk: data.podsumowanie?.tabela_ilosc?.total_sztuk
      });

      return data;
      
    } catch (err: any) {
      const errorMsg = err.message || 'Błąd sprawdzania ilości';
      setError(errorMsg);
      console.error('❌ Błąd sprawdzania ilości:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * POBIERZ SZCZEGÓŁOWE DANE PALET Z ILOŚCIAMI
   */
  const pobierzSzczegoly = async (zkoId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/pallets/zko/${zkoId}/details`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log('📋 Szczegóły palet:', {
        palety_count: data.palety?.length || 0,
        wersja: data.wersja,
        typy_formatek: data.podsumowanie?.typy_formatek
      });

      return data;
      
    } catch (err: any) {
      const errorMsg = err.message || 'Błąd pobierania szczegółów';
      setError(errorMsg);
      console.error('❌ Błąd pobierania szczegółów:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * PEŁNY WORKFLOW - PLANOWANIE + WERYFIKACJA
   */
  const pelnyWorkflow = async (
    zkoId: number, 
    params: PlanowanieModularneParams = {}
  ) => {
    console.log(`🚀 Rozpoczynamy pełny workflow dla ZKO ${zkoId}`);
    
    // 1. Najpierw sprawdź obecny stan
    console.log('📊 Krok 1: Sprawdzanie obecnego stanu...');
    const stanPrzed = await sprawdzIlosci(zkoId);
    
    if (stanPrzed?.status === 'OK') {
      console.log('✅ ZKO ma już poprawnie zaplanowane palety!');
      return await pobierzSzczegoly(zkoId);
    }

    // 2. Planowanie modulariczne
    console.log('🔧 Krok 2: Planowanie modulariczne...');
    const planResult = await planujModularnie(zkoId, params);
    
    if (!planResult) {
      throw new Error('Planowanie nie powiodło się');
    }

    // 3. Weryfikacja po planowaniu  
    console.log('🔍 Krok 3: Weryfikacja wyników...');
    const stanPo = await sprawdzIlosci(zkoId);
    
    if (stanPo?.status !== 'OK') {
      console.warn('⚠️ Wykryto niezgodności ilości po planowaniu:', stanPo?.zgodnosc);
    }

    // 4. Pobierz finalne szczegóły
    console.log('📋 Krok 4: Pobieranie szczegółów...');
    const szczegoly = await pobierzSzczegoly(zkoId);

    console.log('🎉 Workflow zakończony pomyślnie!');
    
    return {
      planowanie: planResult,
      weryfikacja: stanPo,
      szczegoly: szczegoly
    };
  };

  return {
    loading,
    error,
    planujModularnie,
    sprawdzIlosci, 
    pobierzSzczegoly,
    pelnyWorkflow
  };
};