# Komponenty AddPozycja - Dokumentacja

## 🗄️ WAŻNE: Logika biznesowa w PostgreSQL

### 📌 Zasada podstawowa
**PRZED ROZPOCZĘCIEM PRACY ZAWSZE SPRAWDŹ FUNKCJE I WIDOKI W BAZIE DANYCH**

Logika biznesowa systemu ZKO jest zaimplementowana w bazie danych PostgreSQL poprzez:
- **Funkcje składowane** - cała logika obliczeniowa i walidacyjna
- **Widoki** - przygotowane zestawienia danych
- **Triggery** - automatyczne akcje przy zmianach danych
- **Procedury** - złożone operacje biznesowe

### 🔍 Jak pracować z logiką PostgreSQL

1. **Przed implementacją funkcjonalności:**
   ```sql
   -- Sprawdź dostępne funkcje
   SELECT routine_name, routine_type, data_type
   FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE '%zko%';
   
   -- Zobacz szczegóły funkcji
   \df+ nazwa_funkcji
   ```

2. **Analiza widoków:**
   ```sql
   -- Lista widoków
   SELECT table_name 
   FROM information_schema.views 
   WHERE table_schema = 'public';
   
   -- Definicja widoku
   \d+ nazwa_widoku
   ```

3. **Kluczowe funkcje ZKO:**
   - `utworz_puste_zko()` - tworzenie nowego ZKO
   - `dodaj_pozycje_do_zko()` - dodawanie pozycji z walidacją
   - `usun_pozycje_zko()` - usuwanie pozycji z kaskadą
   - `zmien_status_v3()` - workflow statusów
   - `waliduj_limit_plyt()` - sprawdzanie limitu 5 płyt
   - `oblicz_formatki()` - kalkulacja formatek z rozkroju

### ⚙️ Integracja z React

```typescript
// Zawsze używaj funkcji PostgreSQL zamiast logiki w JS
const dodajPozycje = async (dane: DanePozycji) => {
  // NIE rób walidacji w React - PostgreSQL to zrobi
  const result = await db.query(
    'SELECT * FROM dodaj_pozycje_do_zko($1, $2, $3)',
    [zkoId, rozkrojId, kolorePlyty]
  );
  
  // Funkcja zwróci błąd jeśli walidacja nie przejdzie
  if (result.error) {
    showError(result.error_message);
  }
};
```

## ⚠️ KRYTYCZNE: Zasady tworzenia komponentów

### 📏 Limit 300 linii kodu
- **Każdy komponent może mieć maksymalnie 300 linii kodu**
- Jeśli komponent przekracza ten limit, należy go rozbić na podkomponenty
- Podkomponenty umieszczamy w katalogu `components/` 
- Logikę biznesową przenosimy do PostgreSQL lub custom hooks

### 🏗️ Struktura katalogów
```
AddPozycja/
├── components/           # Podkomponenty (max 300 linii każdy)
│   ├── WymiaryInfo.tsx
│   ├── WymiaryColumn.tsx
│   ├── ParametryColumn.tsx
│   └── IloscColumn.tsx
├── steps/               # Komponenty kroków
│   ├── Step1Rozkroj.tsx
│   ├── Step2Plyty.tsx
│   └── Step3Summary.tsx
├── hooks/               # Custom hooks
├── utils/               # Funkcje pomocnicze
├── types.ts            # Definicje typów
└── index.ts            # Eksporty
```

## 🗑️ Usuwanie pozycji

### Funkcjonalność usuwania
- **Przycisk usuwania** przy każdej pozycji w tabeli
- **Potwierdzenie** przed usunięciem (modal/confirm)
- **Kaskadowe usuwanie** - PostgreSQL automatycznie usuwa powiązane dane
- **Odświeżenie** listy po usunięciu

### Implementacja w PostgreSQL:
```sql
-- Funkcja usuwania pozycji
CREATE OR REPLACE FUNCTION usun_pozycje_zko(
  p_pozycja_id INTEGER
) RETURNS json AS $$
BEGIN
  -- Sprawdź czy pozycja istnieje
  IF NOT EXISTS (SELECT 1 FROM pozycje_zko WHERE id = p_pozycja_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Pozycja nie istnieje'
    );
  END IF;
  
  -- Usuń pozycję (CASCADE usuwa powiązane rekordy)
  DELETE FROM pozycje_zko WHERE id = p_pozycja_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Pozycja została usunięta'
  );
END;
$$ LANGUAGE plpgsql;
```

### Użycie w React:
```typescript
const handleDeletePozycja = async (pozycjaId: number) => {
  const confirmed = await Modal.confirm({
    title: 'Czy na pewno usunąć pozycję?',
    content: 'Operacja jest nieodwracalna',
  });
  
  if (confirmed) {
    await api.deletePozycja(pozycjaId);
    refetch(); // Odśwież listę
  }
};
```

## 🚨 LIMIT płyt w pozycji rozkroju

### ⚡ Główna zasada
**MAKSYMALNIE 5 PŁYT ŁĄCZNIE W JEDNEJ POZYCJI ROZKROJU**

To oznacza, że suma wszystkich płyt (niezależnie od koloru) nie może przekroczyć 5 sztuk:
- ✅ **OK:** 2 płyty CZARNE + 3 płyty SONOMA = 5 płyt
- ✅ **OK:** 1 płyta BIAŁA + 2 płyty CZARNE + 2 płyty SONOMA = 5 płyt
- ❌ **BŁĄD:** 3 płyty CZARNE + 3 płyty SONOMA = 6 płyt
- ❌ **BŁĄD:** 2 + 2 + 2 = 6 płyt

### 🔢 Logika walidacji (PostgreSQL)

Walidacja odbywa się w funkcji `waliduj_limit_plyt()`:
```sql
CREATE OR REPLACE FUNCTION waliduj_limit_plyt(
  p_kolory_plyty jsonb
) RETURNS boolean AS $$
DECLARE
  v_suma_plyt INTEGER;
BEGIN
  SELECT SUM((kolor->>'ilosc')::int) 
  INTO v_suma_plyt
  FROM jsonb_array_elements(p_kolory_plyty) AS kolor;
  
  IF v_suma_plyt > 5 THEN
    RAISE EXCEPTION 'Suma płyt (%) przekracza limit 5', v_suma_plyt;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Funkcje PostgreSQL dla ZKO

### Podstawowe operacje
| Funkcja | Opis | Parametry | Zwraca |
|---------|------|-----------|---------|
| `utworz_puste_zko()` | Tworzy nowe ZKO | kooperant, priorytet | zko_id |
| `dodaj_pozycje_do_zko()` | Dodaje pozycję | zko_id, rozkroj_id, kolory | pozycja_id |
| `usun_pozycje_zko()` | Usuwa pozycję | pozycja_id | success |
| `zmien_status_v3()` | Zmienia status | zko_id, nowy_status | success |

### Planowanie i produkcja
| Funkcja | Opis | Parametry | Zwraca |
|---------|------|-----------|---------|
| `pal_planuj_inteligentnie_v3()` | Planuje palety dla pozycji | pozycja_id | palety[] |
| `pal_planuj_inteligentnie_v4()` | Planuje palety dla ZKO | zko_id | palety[] |
| `raportuj_produkcje_formatek()` | Raportuje wykonanie | formatka_id, ilosc | success |
| `zglos_uszkodzenie_formatki()` | Zgłasza uszkodzenie | formatka_id, opis | success |

### Widoki pomocnicze
| Widok | Opis | Kolumny |
|-------|------|---------|
| `v_zko_pelne` | Pełne dane ZKO | wszystkie dane + pozycje |
| `v_pozycje_formatki` | Formatki w pozycjach | pozycja_id, formatki[] |
| `v_stan_produkcji` | Status produkcji | zko_id, procent_wykonania |

## 🎯 Komponenty główne

### KolorePlytyTable.tsx
**Linie kodu:** ~220
- Zarządza globalnym limitem 5 płyt
- Oblicza dostępne miejsce dla każdego koloru
- Wyświetla ostrzeżenia o przekroczeniu
- Używa podkomponentów dla kolumn

### Step2Plyty.tsx
**Linie kodu:** ~280
- Komponent LimitPozycjiAlert dla wizualizacji limitu
- Blokowanie dodawania kolorów przy limicie
- Alertowanie o przekroczeniach
- Używa WymiaryInfo jako podkomponent

## 💡 Dobre praktyki

### Praca z PostgreSQL
1. **Zawsze sprawdzaj funkcje przed implementacją**
2. **Nie duplikuj logiki** - używaj istniejących funkcji
3. **Obsługuj błędy z bazy** - PostgreSQL zwraca szczegółowe komunikaty
4. **Używaj transakcji** dla operacji wielokrokowych

### Walidacja
1. **PostgreSQL jako źródło prawdy** - walidacja głównie w bazie
2. **React tylko dla UX** - wizualne wskazówki, nie twarda walidacja
3. **Błędy z bazy jako komunikaty** - pokazuj użytkownikowi dokładne info

### Wydajność
1. **Używaj widoków** zamiast wielokrotnych zapytań
2. **Cache'uj dane** które się nie zmieniają często
3. **Paginacja** dla długich list

## 🔄 Workflow pracy

1. **Analiza wymagań** → sprawdź jakie funkcje PostgreSQL są dostępne
2. **Implementacja UI** → komponenty React max 300 linii
3. **Integracja z bazą** → wywołaj funkcje PostgreSQL
4. **Obsługa błędów** → wyświetl komunikaty z bazy
5. **Testy** → sprawdź wszystkie przypadki brzegowe

## 📝 Przykład kompletnego flow

```typescript
// 1. Sprawdź dostępne funkcje w PostgreSQL
const checkDatabaseFunctions = async () => {
  const functions = await db.query(`
    SELECT routine_name, data_type 
    FROM information_schema.routines 
    WHERE routine_name LIKE 'zko_%'
  `);
  console.log('Dostępne funkcje:', functions);
};

// 2. Użyj funkcji do dodania pozycji
const addPosition = async (data: PositionData) => {
  try {
    // Funkcja PostgreSQL waliduje i dodaje
    const result = await db.query(
      'SELECT * FROM dodaj_pozycje_do_zko($1, $2, $3)',
      [data.zkoId, data.rozkrojId, JSON.stringify(data.kolory)]
    );
    
    if (result.rows[0].success) {
      message.success('Pozycja dodana');
      refetch();
    }
  } catch (error) {
    // PostgreSQL zwraca dokładny błąd
    message.error(error.message);
  }
};

// 3. Usuń pozycję
const deletePosition = async (positionId: number) => {
  const result = await db.query(
    'SELECT * FROM usun_pozycje_zko($1)',
    [positionId]
  );
  
  if (result.rows[0].success) {
    message.success('Pozycja usunięta');
    refetch();
  }
};
```

## 🚀 Rozszerzenia przyszłe

- [ ] Automatyczna migracja logiki z PostgreSQL do dokumentacji
- [ ] Generator typów TypeScript z funkcji PostgreSQL
- [ ] Dashboard z metrykami wydajności funkcji
- [ ] Automatyczne testy funkcji PostgreSQL