# 🔄 Instrukcja migracji z PaletyManager do PaletyZko

## 📅 Data: 2025-01-17

## 🎯 Cel migracji

Zastąpienie starego modułu `PaletyManager` nowym, ulepszonym modułem `PaletyZko` z poprawionymi obliczeniami i lepszym UI.

## ⚡ Szybka migracja (5 minut)

### Krok 1: Zmień import

```tsx
// STARY KOD:
import { PaletyManager } from './components/PaletyManager';

// NOWY KOD:
import { PaletyZko } from './components/PaletyZko';
```

### Krok 2: Zmień komponent

```tsx
// STARY KOD:
<PaletyManager 
  zkoId={zkoId} 
  onRefresh={handleRefresh}
/>

// NOWY KOD:
<PaletyZko 
  zkoId={zkoId} 
  onRefresh={handleRefresh}
/>
```

### Krok 3: Gotowe! 🎉

Nowy moduł ma takie same props jak stary, więc działa jako drop-in replacement.

## 📋 Pełna migracja (jeśli używasz zaawansowanych funkcji)

### 1. Sprawdź używane hooki

Jeśli używasz hooków ze starego modułu bezpośrednio:

```tsx
// STARY:
import { usePaletyManager, usePaletyModular } from '../../hooks';

// NOWY:
import { usePalety, useFormatki } from './components/PaletyZko/hooks';
```

### 2. Zaktualizuj API calls

Stary moduł używał różnych endpointów. Nowy moduł ma ujednolicone API:

```tsx
// Stare endpointy:
/api/pallets/v5/...
/api/pallets/planuj-inteligentnie

// Nowe endpointy:
/api/pallets/manual/...
/api/pallets/modular/...
```

### 3. Zaktualizuj typy

```tsx
// STARY:
import { PaletaType, FormatkaType } from './PaletyManager/types';

// NOWY:
import { Paleta, Formatka } from './components/PaletyZko/types';
```

## 🆚 Porównanie funkcjonalności

| Funkcja | PaletyManager (stary) | PaletyZko (nowy) | Status |
|---------|----------------------|------------------|---------|
| Tworzenie palet | ✅ | ✅ Ulepszone | ✨ Lepsze |
| Edycja palet | ✅ | ✅ | ✅ Działa |
| Usuwanie palet | ✅ | ✅ Z walidacją FK | ✨ Lepsze |
| Drag & Drop | ❌ | ✅ | 🆕 Nowe |
| Karty palet | ❌ | ✅ | 🆕 Nowe |
| Planowanie V5 | ✅ Błędne | ❌ Wyłączone | ⚠️ Używaj V2 |
| Planowanie V2 | ✅ | ✅ | ✅ Działa |
| Wizualizacja kolorów | ⚠️ Podstawowa | ✅ Pełna | ✨ Lepsze |
| Obliczenia wysokości | ❌ Błędne | ✅ Poprawne | 🔧 Naprawione |
| Statystyki | ✅ | ✅ Real-time | ✨ Lepsze |
| Historia palety | ❌ | ✅ | 🆕 Nowe |

## ⚠️ Ważne zmiany

### 1. Obliczenia wysokości
- **Stary**: wysokość = liczba_formatek × grubość (BŁĘDNE!)
- **Nowy**: wysokość = liczba_poziomów × grubość (POPRAWNE!)

### 2. Planowanie V5 wyłączone
- V5 ma błąd z liczeniem ilości
- Używaj planowania modularnego (V2)

### 3. Nowe limity
```typescript
// Nowy moduł ma sztywne limity:
MAX_WAGA_KG: 700 (zamiast 1000)
MAX_WYSOKOSC_MM: 1440 (zamiast 2000)
```

## 🔧 Rozwiązywanie problemów

### Problem: "Cannot find module PaletyZko"

**Rozwiązanie:**
```bash
# Sprawdź czy katalog istnieje
ls apps/zko/src/modules/zko/components/PaletyZko

# Jeśli nie, pobierz najnowsze zmiany
git pull
```

### Problem: "API endpoint not found"

**Rozwiązanie:**
Upewnij się, że backend jest zaktualizowany:
```bash
cd services/zko-service
npm run build
npm run start
```

### Problem: "Foreign key constraint violation"

**Rozwiązanie:**
Nowy moduł poprawnie obsługuje FK. Jeśli widzisz ten błąd, to znaczy że próbujesz usunąć paletę z powiązaniami. Usuń najpierw powiązania lub użyj funkcji `pal_helper_usun_palety`.

## 📊 Testowanie po migracji

### Checklist:
- [ ] Tworzenie nowej palety działa
- [ ] Drag & drop formatek działa
- [ ] Statystyki są poprawne
- [ ] Wysokości palet < 1440mm
- [ ] Wagi palet < 700kg
- [ ] Kolory są widoczne
- [ ] Historia palety się wyświetla

### Test ręczny:
1. Utwórz nową paletę
2. Dodaj 80 formatek
3. Sprawdź czy wysokość = ~360mm (20 poziomów × 18mm)
4. NIE 1440mm jak w starym module!

## 🚀 Opcjonalne ulepszenia

Po migracji możesz włączyć dodatkowe funkcje:

### 1. Włącz drag & drop
```tsx
// Automatycznie włączone w nowym module
// Przeciągaj formatki między paletami
```

### 2. Użyj kart zamiast tabeli
```tsx
// Automatycznie w nowym module
// Bardziej wizualne i intuicyjne
```

### 3. Dodaj wizualizator 3D
```tsx
// TODO: W przygotowaniu
import { PaletaVisualizer } from './components/PaletyZko/components';
```

## 📞 Wsparcie

W razie problemów:
- Email: biuro@alpmeb.pl
- Sprawdź: `AlpApp/apps/zko/src/modules/zko/components/PaletyZko/README.md`
- Logi: `AlpApp/logs/migration.log`

## ✅ Podsumowanie

Migracja jest prosta - wystarczy zmienić import i nazwę komponentu. Nowy moduł jest w pełni kompatybilny wstecz, ale oferuje znacznie lepsze funkcjonalności i poprawione obliczenia.

**Główne korzyści:**
- ✅ Poprawne obliczenia wysokości
- ✅ Drag & drop formatek
- ✅ Lepsze UI z kartami
- ✅ Wizualizacja kolorów
- ✅ Historia zmian

---

**Autor:** marlowX  
**Data:** 2025-01-17  
**Wersja:** 1.0
