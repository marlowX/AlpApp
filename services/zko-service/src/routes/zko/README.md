# 📁 Struktura routingu ZKO

## ⚠️ KRYTYCZNA ZASADA: Maksymalnie 300 linii kodu na plik!

### 🏗️ Architektura
Routing ZKO jest podzielony na małe, wyspecjalizowane moduły:

```
zko/
├── README.md                 # Ten plik
├── index.ts                  # Główny router (agreguje wszystkie pod-routery)
├── schemas.ts                # Schematy walidacji Zod
├── list.routes.ts           # GET /api/zko - lista ZKO
├── details.routes.ts        # GET /api/zko/:id - szczegóły
├── stats.routes.ts          # GET /api/zko/stats - statystyki ZKO 🆕
├── create.routes.ts         # POST /api/zko/create - tworzenie
├── pozycje.routes.ts        # Operacje na pozycjach (add, delete, edit)
├── status.routes.ts         # Zmiana statusu i workflow
├── complete.routes.ts       # Zakończenie zlecenia
├── functions.routes.ts      # Wywołanie funkcji PostgreSQL
├── kooperanci.routes.ts     # Lista kooperantów
└── utils/
    ├── error-handler.ts     # Obsługa błędów
    └── logger.ts            # Logowanie
```

### 📊 Nowe endpointy statystyk (stats.routes.ts)

#### GET /api/zko/summary
Zwraca podsumowanie wszystkich ZKO:
- Liczba ZKO (wszystkie, nowe, zakończone, pilne)
- Suma pozycji, palet, formatek
- Całkowita waga i ilość płyt

#### GET /api/zko/:id/stats
Szczegółowe statystyki pojedynczego ZKO:
- Dane podstawowe ZKO
- Liczba pozycji, palet, formatek
- Procent realizacji
- Podsumowanie pozycji i palet

#### GET /api/zko/list-with-stats
Lista ZKO wzbogacona o statystyki:
- Wszystkie dane z listy podstawowej
- Dodatkowe pola: pozycje_count, palety_count, formatki_total
- Obliczony procent_realizacji
- Waga całkowita i ilość płyt

### 📏 Limity kodu
- **Każdy plik**: maksymalnie 300 linii
- **Każda funkcja**: maksymalnie 50 linii
- **Każdy endpoint**: własna funkcja

### 🔄 Workflow dodawania nowego endpointa

1. **Określ kategorię** - do którego pliku pasuje endpoint?
2. **Sprawdź rozmiar** - czy plik nie przekroczy 300 linii?
3. **Jeśli za duży** - stwórz nowy plik w odpowiedniej kategorii
4. **Dodaj do index.ts** - zarejestruj nowy router

### 💡 Dobre praktyki

#### ✅ Tak:
```typescript
// pozycje.routes.ts - maksymalnie 300 linii
export const pozycjeRouter = Router();

pozycjeRouter.post('/add', validateSchema(AddPozycjaSchema), addPozycja);
pozycjeRouter.delete('/:id', validateSchema(DeletePozycjaSchema), deletePozycja);
pozycjeRouter.put('/:id', validateSchema(EditPozycjaSchema), editPozycja);
```

#### ❌ Nie:
```typescript
// zko.routes.ts - 600+ linii - ZA DUŻO!
router.get('/', ...);
router.get('/:id', ...);
router.post('/create', ...);
router.post('/pozycje/add', ...);
// ... setki linii kodu
```

### 🎯 Zasady podziału

1. **Po funkcjonalności** - każda grupa funkcji w osobnym pliku
2. **Po metodzie HTTP** - jeśli grupa jest duża, dziel po metodach
3. **Po encji** - pozycje, palety, workflow - osobne pliki
4. **Wspólna logika** - wydziel do utils/

### 📊 Aktualne rozmiary plików

| Plik | Linie | Status |
|------|-------|--------|
| index.ts | 50 | ✅ OK |
| schemas.ts | 120 | ✅ OK |
| list.routes.ts | 95 | ✅ OK |
| details.routes.ts | 85 | ✅ OK |
| stats.routes.ts | 195 | ✅ OK 🆕 |
| create.routes.ts | 75 | ✅ OK |
| pozycje.routes.ts | 280 | ✅ OK |
| status.routes.ts | 150 | ✅ OK |
| complete.routes.ts | 65 | ✅ OK |
| kooperanci.routes.ts | 45 | ✅ OK |

### 🔍 Monitorowanie

Regularnie sprawdzaj rozmiary plików:
```bash
# Sprawdź pliki przekraczające 300 linii
find . -name "*.ts" -exec wc -l {} \; | awk '$1 > 300 {print}'
```

### 🚨 Sygnały ostrzegawcze

- Plik ma ponad 250 linii - rozważ podział
- Plik ma ponad 300 linii - NATYCHMIAST podziel
- Funkcja ma ponad 50 linii - wydziel pod-funkcje
- Duplikacja kodu - wydziel do utils/

### 📝 Przykład refaktoryzacji

**Przed (zko.routes.ts - 600+ linii):**
```typescript
router.post('/pozycje/add', async (req, res) => {
  // 150 linii kodu obsługi dodawania pozycji
});

router.delete('/pozycje/:id', async (req, res) => {
  // 100 linii kodu obsługi usuwania
});
```

**Po (pozycje.routes.ts - 250 linii):**
```typescript
import { addPozycjaHandler, deletePozycjaHandler } from './handlers';

const router = Router();
router.post('/add', addPozycjaHandler);
router.delete('/:id', deletePozycjaHandler);
export default router;
```

### 🔗 Integracja z PostgreSQL

Pamiętaj o zasadach z głównego README:
- **Logika biznesowa w PostgreSQL** - nie duplikuj w Node.js
- **Wywołuj funkcje PostgreSQL** - nie pisz własnej logiki
- **Obsługuj błędy z bazy** - PostgreSQL zwraca dokładne komunikaty