import { useEffect, useState } from 'react';
import type { KolorPlyty, Plyta, Rozkroj } from '../components/AddPozycja/types';

export const usePozycjaValidation = (
  selectedRozkroj: Rozkroj | null,
  kolorePlyty: KolorPlyty[],
  plyty: Plyta[]
) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const errors: string[] = [];
    
    // Sprawdź rozkrój
    if (!selectedRozkroj) {
      errors.push('Nie wybrano rozkroju');
    }
    
    // Sprawdź każdą płytę
    kolorePlyty.forEach((plyta, index) => {
      if (!plyta.kolor) {
        errors.push(`Pozycja ${index + 1}: Nie wybrano płyty`);
      } else {
        // Sprawdź stan magazynowy
        if (plyta.ilosc > (plyta.stan_magazynowy || 0)) {
          errors.push(
            `Pozycja ${index + 1} (${plyta.kolor}): Ilość ${plyta.ilosc} przekracza stan magazynowy (${plyta.stan_magazynowy})`
          );
        }
        
        // Sprawdź limit dla grubych płyt
        const plytaInfo = plyty.find(p => p.kolor_nazwa === plyta.kolor);
        if (plytaInfo && plytaInfo.grubosc >= 18 && plyta.ilosc > 5) {
          errors.push(
            `Pozycja ${index + 1} (${plyta.kolor}): Maksymalna ilość płyt ≥18mm to 5 sztuk`
          );
        }
      }
    });
    
    // Sprawdź duplikaty
    const kolory = kolorePlyty.filter(p => p.kolor).map(p => p.kolor);
    const duplikaty = kolory.filter((item, index) => kolory.indexOf(item) !== index);
    if (duplikaty.length > 0) {
      errors.push(`Duplikaty kolorów: ${duplikaty.join(', ')}`);
    }
    
    setValidationErrors(errors);
  }, [selectedRozkroj, kolorePlyty, plyty]);

  const isFormValid = 
    validationErrors.length === 0 && 
    selectedRozkroj !== null && 
    kolorePlyty.some(p => p.kolor);

  return {
    validationErrors,
    isFormValid
  };
};
