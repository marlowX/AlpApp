import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { 
  Paleta, 
  PlanowaniePaletParams, 
  PlanPaletyzacjiV5,
  SmartDeleteParams,
  SmartDeleteResult,
  ReorganizacjaPaletParams,
  ReorganizacjaPaletResult,
  TransferFormatekParams,
  TransferFormatekResult,
  StatystykiPalet,
  UsePaletyManagerResult,
  MESSAGES
} from '../types';

/**
 * Hook do zarządzania paletami V5
 * Centralizuje wszystkie operacje na paletach
 */
export const usePaletyManager = (zkoId: number): UsePaletyManagerResult => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statystyki, setStatystyki] = useState<StatystykiPalet | null>(null);

  // Pobieranie palet
  const fetchPalety = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPalety(data.palety || []);
        
        // Pobierz również statystyki
        await fetchStatystyki();
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || MESSAGES.PLAN_ERROR;
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || MESSAGES.PLAN_ERROR;
      setError(errorMsg);
      console.error('Error fetching palety:', err);
    } finally {
      setLoading(false);
    }
  }, [zkoId]);

  // Pobieranie statystyk
  const fetchStatystyki = useCallback(async () => {
    try {
      const response = await fetch(`/api/pallets/stats/${zkoId}`);
      if (response.ok) {
        const data = await response.json();
        setStatystyki(data.statystyki);
      }
    } catch (err) {
      console.warn('Error fetching stats:', err);
    }
  }, [zkoId]);

  // Planowanie palet V5
  const planuj = useCallback(async (params: PlanowaniePaletParams): Promise<PlanPaletyzacjiV5> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/plan-v5`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || MESSAGES.PLAN_V5_SUCCESS);
          await fetchPalety(); // Odśwież listę
        } else {
          message.warning(result.komunikat || MESSAGES.PLAN_ERROR);
        }
        
        return result;
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || MESSAGES.PLAN_ERROR;
        message.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || MESSAGES.PLAN_ERROR;
      setError(errorMsg);
      message.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [zkoId, fetchPalety]);

  // Inteligentne usuwanie V5
  const usun = useCallback(async (params: SmartDeleteParams): Promise<SmartDeleteResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/delete-smart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || MESSAGES.DELETE_SUCCESS);
          await fetchPalety(); // Odśwież listę
        } else {
          message.warning(result.komunikat || MESSAGES.DELETE_ERROR);
        }
        
        return result;
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || MESSAGES.DELETE_ERROR;
        message.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || MESSAGES.DELETE_ERROR;
      setError(errorMsg);
      message.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [zkoId, fetchPalety]);

  // Reorganizacja V5
  const reorganizuj = useCallback(async (params: ReorganizacjaPaletParams): Promise<ReorganizacjaPaletResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/reorganize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || MESSAGES.REORGANIZE_SUCCESS);
          await fetchPalety(); // Odśwież listę
        } else {
          message.warning(result.komunikat || MESSAGES.REORGANIZE_ERROR);
        }
        
        return result;
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || MESSAGES.REORGANIZE_ERROR;
        message.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || MESSAGES.REORGANIZE_ERROR;
      setError(errorMsg);
      message.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [zkoId, fetchPalety]);

  // Przenoszenie formatek V5
  const przenies = useCallback(async (params: TransferFormatekParams): Promise<TransferFormatekResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/pallets/transfer-v5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || MESSAGES.TRANSFER_SUCCESS);
          await fetchPalety(); // Odśwież listę
        } else {
          message.warning(result.komunikat || MESSAGES.TRANSFER_ERROR);
        }
        
        return result;
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || MESSAGES.TRANSFER_ERROR;
        message.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || MESSAGES.TRANSFER_ERROR;
      setError(errorMsg);
      message.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPalety]);

  // Zamykanie palety
  const zamknij = useCallback(async (
    paletaId: number, 
    operator?: string, 
    uwagi?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/pallets/${paletaId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator: operator || 'user',
          uwagi: uwagi || 'Zamknięcie palety z poziomu aplikacji'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || MESSAGES.CLOSE_SUCCESS);
          await fetchPalety(); // Odśwież listę
        } else {
          message.warning(result.komunikat || MESSAGES.CLOSE_ERROR);
        }
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || MESSAGES.CLOSE_ERROR;
        message.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || MESSAGES.CLOSE_ERROR;
      setError(errorMsg);
      message.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPalety]);

  // Refresh - alias dla fetchPalety
  const refresh = useCallback(async () => {
    await fetchPalety();
  }, [fetchPalety]);

  // Załaduj dane przy pierwszym renderze
  useEffect(() => {
    if (zkoId) {
      fetchPalety();
    }
  }, [zkoId, fetchPalety]);

  return {
    palety,
    loading,
    error,
    refresh,
    planuj,
    usun,
    reorganizuj,
    przenies,
    zamknij,
    statystyki
  };
};

/**
 * Hook do sprawdzania dostępności funkcji V5
 */
export const usePaletyV5Availability = () => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [missingFunctions, setMissingFunctions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const response = await fetch('/api/pallets/functions/check');
        
        if (response.ok) {
          const data = await response.json();
          setIsAvailable(data.sukces);
          setMissingFunctions(data.brakujace_funkcje || []);
        } else {
          setIsAvailable(false);
          setMissingFunctions(['API endpoint not available']);
        }
      } catch (error) {
        console.error('Error checking V5 availability:', error);
        setIsAvailable(false);
        setMissingFunctions(['Connection error']);
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, []);

  return {
    isAvailable,
    missingFunctions,
    loading
  };
};

/**
 * Hook do walidacji parametrów planowania
 */
export const usePlanowanieValidation = () => {
  const validateParams = useCallback((params: PlanowaniePaletParams) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Sprawdź wysokość
    if (params.max_wysokosc_mm < 400) {
      errors.push('Minimalna wysokość to 400mm');
    }
    if (params.max_wysokosc_mm > 1600) {
      warnings.push('Wysokość powyżej 1600mm może być problematyczna');
    }
    
    // Sprawdź wagę
    if (params.max_waga_kg < 100) {
      errors.push('Minimalna waga to 100kg');
    }
    if (params.max_waga_kg > 1000) {
      warnings.push('Waga powyżej 1000kg może być problematyczna');
    }
    
    // Sprawdź formatki
    if (params.max_formatek_na_palete > 500) {
      warnings.push('Więcej niż 500 formatek może być trudne w obsłudze');
    }
    if (params.max_formatek_na_palete < 50) {
      warnings.push('Mniej niż 50 formatek może być nieefektywne');
    }
    
    // Sprawdź strategię vs oklejanie
    if (params.strategia === 'oklejanie' && !params.uwzglednij_oklejanie) {
      warnings.push('Strategia "oklejanie" wymaga włączenia uwzględniania oklejania');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    };
  }, []);

  return { validateParams };
};