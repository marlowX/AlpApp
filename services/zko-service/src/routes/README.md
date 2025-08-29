# 📁 Struktura routingu Backend

## ⚠️ KRYTYCZNA ZASADA: Maksymalnie 300 linii kodu na plik!

### 🚨 Problem z dużymi plikami
Pierwotnie `zko.routes.ts` miał ponad 600 linii kodu, co łamało podstawową zasadę architektury.

### ✅ Rozwiązanie - podział na moduły

```
routes/
├── README.md              # Ten plik
├── zko/                   # Moduł ZKO - PODZIELONY NA MAŁE PLIKI
│   ├── index.ts          # Agregator (50 linii)
│   ├── schemas.ts        # Schematy Zod (120 linii)
│   ├── list.routes.ts    # Lista ZKO (95 linii)
│   ├── details.routes.ts # Szczegóły (85 linii)
│   ├── create.routes.ts  # Tworzenie (75 linii)
│   ├── pozycje.routes.ts # Pozycje (40 linii)
│   ├── status.routes.ts  # Status (50 linii)
│   ├── complete.routes.ts# Zakończenie (45 linii)
│   ├── functions.routes.ts # Funkcje PG (55 linii)
│   ├── handlers/         # Handlery dla złożonej logiki
│   │   └── pozycje.handlers.ts (150 linii)
│   └── utils/            # Wspólne narzędzia
│       ├── logger.ts     # Logowanie (25 linii)
│       └── error-handler.ts # Obsługa błędów (60 linii)
├── workflow.routes.ts    # Workflow (< 300 linii)
├── pallets.routes.ts     # Palety (< 300 linii)
├── production.routes.ts  # Produkcja (< 300 linii)
├── buffer.routes.ts      # Bufory (< 300 linii)
├── rozkroje.routes.ts    # Rozkroje (< 300 linii)
├── plyty.routes.ts       # Płyty (< 300 linii)
├── database.routes.ts    # Baza danych (< 300 linii)
└── test.routes.ts        # Testy (< 300 linii)
```

### 📏 Monitorowanie rozmiarów

```bash
# Sprawdź pliki przekraczające limit
find . -name "*.ts" -exec sh -c 'lines=$(wc -l < "$1"); if [ $lines -gt 300 ]; then echo "$1: $lines lines - TOO BIG!"; fi' _ {} \;

# Pokaż wszystkie rozmiary
find . -name "*.ts" -exec sh -c 'printf "%-40s %4d lines\n" "$1" $(wc -l < "$1")' _ {} \;
```

### 🎯 Zasady podziału

1. **Funkcjonalność** - każda grupa endpointów w osobnym pliku
2. **Rozmiar** - maksymalnie 300 linii
3. **Handlery** - złożona logika w osobnych handlerach
4. **Utils** - wspólny kod w utils/
5. **Schematy** - walidacja Zod w schemas.ts

### 💡 Przykład refaktoryzacji

**PRZED (zko.routes.ts - 600+ linii):**
```typescript
// Wszystko w jednym pliku
router.get('/', ...);      // 100 linii
router.get('/:id', ...);   // 80 linii
router.post('/create', ...); // 70 linii
router.post('/pozycje/add', ...); // 150 linii
router.delete('/pozycje/:id', ...); // 100 linii
// ... i tak dalej
```

**PO (katalog zko/):**
```typescript
// list.routes.ts (95 linii)
router.get('/', listHandler);

// details.routes.ts (85 linii)
router.get('/:id', detailsHandler);

// pozycje.routes.ts (40 linii)
router.post('/add', addPozycjaHandler);
router.delete('/:id', deletePozycjaHandler);

// handlers/pozycje.handlers.ts (150 linii)
export const addPozycjaHandler = async (...) => { ... }
export const deletePozycjaHandler = async (...) => { ... }
```

### 🔄 Workflow dodawania nowego endpointa

1. **Znajdź odpowiedni plik** - gdzie pasuje funkcjonalnie?
2. **Sprawdź rozmiar** - `wc -l plik.ts`
3. **Jeśli > 250 linii** - stwórz nowy plik lub handler
4. **Jeśli > 300 linii** - NATYCHMIAST refaktoryzuj!
5. **Dodaj do index.ts** - zarejestruj nowy router

### 📊 Aktualne statystyki

| Moduł | Pliki | Łącznie linii | Status |
|-------|-------|---------------|--------|
| zko/ | 11 | ~700 | ✅ Podzielone prawidłowo |
| workflow | 1 | ~200 | ✅ OK |
| pallets | 1 | ~250 | ✅ OK |
| production | 1 | ~180 | ✅ OK |
| buffer | 1 | ~150 | ✅ OK |

### 🚨 Lista do refaktoryzacji

- [ ] Sprawdzić wszystkie pliki > 300 linii
- [ ] Podzielić duże handlery na mniejsze funkcje
- [ ] Wydzielić wspólną logikę do utils
- [ ] Dodać testy jednostkowe dla handlerów

### 🔗 Integracja z PostgreSQL

**WAŻNE:** Logika biznesowa jest w PostgreSQL!
- Routing tylko wywołuje funkcje PostgreSQL
- Nie duplikuj logiki w Node.js
- Obsługuj błędy zwracane przez PostgreSQL
- Używaj transakcji dla operacji wielokrokowych