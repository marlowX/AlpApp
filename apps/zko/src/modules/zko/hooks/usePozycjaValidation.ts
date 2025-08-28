import { useEffect, useState } from 'react';
import type { KolorPlyty, Plyta, Rozkroj } from '../components/AddPozycja/types';

interface UsePozycjaValidationOptions {
  validateOnMount?: boolean; // Domyślnie false - nie waliduj od razu
}

export const usePozycjaValidation = (
  selectedRozkroj: Rozkroj | null,
  kolorePlyty: KolorPlyty[],
  plyty: Plyta[],
  options: UsePozycjaValidationOptions = {}
) => {
  const { validateOnMount = false } = options;
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  useEffect(() => {
    // Nie waliduj jeśli formularz nie został jeszcze "dotknięty" i validateOnMount jest false
    if (!hasBeenTouched && !validateOnMount) {
      setValidationErrors([]);
      return;
    }

    const errors: string[] = [];
    
    // Sprawdź rozkrój
    if (!selectedRozkroj) {
      errors.push('Nie wybrano rozkroju');
    }
    
    // Sprawdź każdą płytę - ale tylko jeśli jest więcej niż domyślna pusta
    const hasAnyFilledPlyta = kolorePlyty.some(p => p.kolor);
    
    if (hasAnyFilledPlyta) {
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
    } else {
      // Jeśli nie ma żadnej wypełnionej płyty, tylko dodaj informację
      errors.push('Dodaj przynajmniej jedną płytę');
    }
    
    setValidationErrors(errors);
  }, [selectedRozkroj, kolorePlyty, plyty, hasBeenTouched, validateOnMount]);

  const isFormValid = 
    validationErrors.length === 0 && 
    selectedRozkroj !== null && 
    kolorePlyty.some(p => p.kolor);

  // Funkcja do "dotknięcia" formularza - rozpoczyna walidację
  const touchForm = () => {
    setHasBeenTouched(true);
  };

  // Funkcja do zresetowania walidacji
  const resetValidation = () => {
    setHasBeenTouched(false);
    setValidationErrors([]);
  };

  return {
    validationErrors: hasBeenTouched ? validationErrors : [],
    isFormValid: hasBeenTouched ? isFormValid : true, // Na początku uznajemy że jest OK
    touchForm,
    resetValidation,
    hasBeenTouched
  };
};
