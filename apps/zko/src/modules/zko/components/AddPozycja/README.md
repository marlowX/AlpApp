# AddPozycja - Struktura komponentów

## 📁 Struktura plików

```
src/modules/zko/components/AddPozycja/
├── index.ts                 # Export głównych komponentów
├── types.ts                 # Typy TypeScript
├── AddPozycjaModal.tsx      # Główny modal (250 linii)
├── PlytySelector.tsx        # Komponent wyboru płyt (87 linii) 
├── RozkrojSelector.tsx      # Komponent wyboru rozkroju (49 linii)
├── KolorePlytyTable.tsx     # Tabela kolorów płyt (140 linii)
└── FormatkiPreview.tsx      # Podgląd formatek (57 linii)

src/modules/zko/hooks/
├── index.ts                 # Export wszystkich hooków
├── usePlyty.ts              # Hook do zarządzania płytami (120 linii)
└── useRozkroje.ts           # Hook do zarządzania rozkrojami (78 linii)

services/api/
└── plyty-routes.ts          # API endpoints dla płyt (120 linii)
```

## 🔧 Główne funkcjonalności

### 1. **PlytySelector** 
- Pobiera płyty z PostgreSQL sortowane po popularności (stan_magazynowy DESC)
- Filtrowanie w czasie rzeczywistym
- Ładne formatowanie opcji z kolorami i stanami magazynowymi
- Auto-complete z wyszukiwaniem

### 2. **KolorePlytyTable**
- Dynamiczna tabela z dodawaniem/usuwaniem kolorów
- Walidacja limitów płyt (5 dla 18mm+, więcej dla cieńszych)
- Sprawdzanie stanu magazynowego
- Auto-fill nazw płyt

### 3. **FormatkiPreview**
- Podgląd formatek w wybranym rozkroju
- Obliczanie całkowitej liczby formatek

### 4. **Hooki**
- `usePlyty()` - pobiera płyty z API z filtrowaniem
- `useRozkroje()` - pobiera rozkroje z formatkami
- Fallback do danych testowych przy błędach API

## 🎯 Kluczowe ulepszenia

1. **Podział na małe komponenty** - każdy plik < 300 linii ✅
2. **Sortowanie płyt po popularności** - stan_magazynowy DESC
3. **Filtrowanie w czasie rzeczywistym** - po opisie, nazwie, kolorze
4. **Ładne formatowanie listy** - z kolorami i stanami magazynowymi
5. **Walidacja stanu magazynowego** - sprawdza dostępność
6. **Hooki do zarządzania stanem** - czytelny kod
7. **API endpoints** - bezpośrednie zapytania do PostgreSQL

## 📡 Funkcje PostgreSQL wykorzystane

- Sortowanie: `ORDER BY stan_magazynowy DESC, struktura DESC NULLS LAST`
- Filtrowanie: `WHERE aktywna = true AND opis ILIKE '%search%'`
- Grupowanie kolorów: `GROUP BY kolor_nazwa`

## 🚀 Użycie

```tsx
import { AddPozycjaModal } from './components/AddPozycja';

<AddPozycjaModal 
  visible={showModal}
  zkoId={123}
  onCancel={() => setShowModal(false)}
  onSuccess={() => {
    setShowModal(false);
    refetchZKO();
  }}
/>
```

## 🔍 Popularność płyt

System używa `stan_magazynowy` jako wskaźnik popularności:
- Wyższy stan = częściej używana płyta = wyższa pozycja na liście
- Dodatkowo płyty strukturowane (`struktura = 1`) są wyżej
- Sortowanie alfabetyczne jako trzeci kryterium

To rozwiązanie nie obciąża systemu dodatkowym licznikiem popularności.
