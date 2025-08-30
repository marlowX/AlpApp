// hooks/usePaletyModular.ts
import { useState } from 'react';

interface PlanowanieModularneParams {
  max_wysokosc_mm?: number;
  max_formatek_na_palete?: number;
  nadpisz_istniejace?: boolean;
  operator?: string;
  strategia?: 'modular' | 'kolory';  // 🆕 NOWA OPCJA
}

interface FormatkaSzczegol {
  formatka_id: number;
  ilosc: number;
  nazwa: string;
  dlugosc?: number;
  szerokosc?: number;
  kolor?: string;
}

interface PaletaSzczegol {
  id: number;
  numer_palety: string;
  sztuk_total: number;
  wysokosc_stosu: number;
  waga_kg: number;
  kolory_na_palecie?: string;
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
  formatki_info?: {
    typy_formatek: number;
    total_sztuk: number;
  };
  strategia?: 'modular' | 'kolory';
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
   * 🆕 Obsługuje strategię 'kolory' dla grupowania po kolorach
   */
  const planujModularnie = async (
    zkoId: number, 
    params: PlanowanieModularneParams = {}
  ): Promise<PlanowanieModularneResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const requestParams = {
        max_wysokosc_mm: 1440,
        max_formatek_na_palete: 80,
        nadpisz_istniejace: false,
        operator: 'user',
        strategia: 'kolory' as const, // 🆕 DOMYŚLNIE KOLORY
        ...params
      };

      console.log(`🎯 Planowanie ${requestParams.strategia} dla ZKO ${zkoId}:`, requestParams);

      const response = await fetch(`/api/pallets/zko/${zkoId}/plan-modular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.sukces) {
        throw new Error(data.komunikat || 'Planowanie nie powiodło się');
      }

      console.log(`✅ Planowanie ${requestParams.strategia} sukces:`, {
        palety: data.palety_utworzone?.length || 0,
        sztuki_total: data.formatki_info?.total_sztuk || data.statystyki?.sztuk_total || 0,
        strategia: data.strategia,
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
   * 🆕 PLANOWANIE Z KOLORAMI - dedykowana funkcja
   */
  const planujZKolorami = async (
    zkoId: number,
    params: Omit<PlanowanieModularneParams, 'strategia'> = {}
  ): Promise<PlanowanieModularneResponse | null> => {
    return planujModularnie(zkoId, { ...params, strategia: 'kolory' });
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
   * 🔧 POPRAWKA: Respektuje nadpisz_istniejace i strategię
   */
  const pelnyWorkflow = async (
    zkoId: number, 
    params: PlanowanieModularneParams = {}
  ) => {
    const strategia = params.strategia || 'kolory';
    console.log(`🚀 Rozpoczynamy pełny workflow ${strategia} dla ZKO ${zkoId}`);
    
    // 1. Sprawdź obecny stan tylko jeśli nie nadpisujemy
    if (!params.nadpisz_istniejace) {
      console.log('📊 Krok 1: Sprawdzanie obecnego stanu...');
      const stanPrzed = await sprawdzIlosci(zkoId);
      
      if (stanPrzed?.status === 'OK' && stanPrzed.podsumowanie?.palety?.liczba_palet > 0) {
        console.log('✅ ZKO ma już poprawnie zaplanowane palety! Zwracam obecne dane.');
        return await pobierzSzczegoly(zkoId);
      }
    } else {
      console.log('🔄 Krok 1: Nadpisywanie istniejących palet...');
    }

    // 2. Planowanie modulariczne (zawsze gdy nadpisujemy lub gdy nie ma palet)
    console.log(`🔧 Krok 2: Planowanie ${strategia}...`);
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

    console.log(`🎉 Workflow ${strategia} zakończony pomyślnie!`);
    
    return {
      planowanie: planResult,
      weryfikacja: stanPo,
      szczegoly: szczegoly
    };
  };

  /**
   * 🆕 INTELIGENTNE PLANOWANIE - sprawdza status i pyta użytkownika
   * Teraz z obsługą strategii
   */
  const inteligentneZnalowanie = async (
    zkoId: number,
    params: PlanowanieModularneParams = {},
    forceOverwrite: boolean = false
  ) => {
    const strategia = params.strategia || 'kolory';
    console.log(`🤖 Inteligentne planowanie ${strategia} dla ZKO ${zkoId}`);
    
    // Sprawdź obecny stan
    const stanPrzed = await sprawdzIlosci(zkoId);
    
    const maPalety = (stanPrzed?.podsumowanie?.palety?.liczba_palet || 0) > 0;
    const statusOK = stanPrzed?.status === 'OK';
    
    console.log(`📊 Stan: palety=${maPalety}, status=${stanPrzed?.status}, strategia=${strategia}`);
    
    if (maPalety && !forceOverwrite) {
      return {
        potrzebaTPotwierdzenia: true,
        obecnyStatus: stanPrzed,
        komunikat: statusOK 
          ? `ZKO ma już ${stanPrzed.podsumowanie.palety.liczba_palet} palet (status OK). Czy zastąpić planowaniem ${strategia === 'kolory' ? 'z kolorami' : 'modularicznym'}?`
          : `ZKO ma ${stanPrzed.podsumowanie.palety.liczba_palet} palet z błędami. Zalecane planowanie ${strategia === 'kolory' ? 'z kolorami' : 'modulariczne'}.`,
        zalecaneNadpisanie: !statusOK,
        strategia: strategia
      };
    }
    
    // Planuj z odpowiednimi parametrami
    return await pelnyWorkflow(zkoId, {
      ...params,
      nadpisz_istniejace: forceOverwrite || maPalety,
      strategia: strategia
    });
  };

  return {
    loading,
    error,
    planujModularnie,
    planujZKolorami, // 🆕 Dedykowana funkcja dla kolorów
    sprawdzIlosci, 
    pobierzSzczegoly,
    pelnyWorkflow,
    inteligentneZnalowanie
  };
};