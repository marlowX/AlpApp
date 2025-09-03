# Komponenty ZKO

## 📊 Nowa strona listy ZKO

### ZKOModernListPage
**Lokalizacja:** `pages/ZKOModernListPage.tsx`
- Nowoczesna lista zleceń ZKO w stylu ERP
- Grid kart z pełnymi informacjami
- Wbudowane filtry i wyszukiwarka
- Responsywny design

### ZKOListCard
**Lokalizacja:** `components/ZKOListCard/`
- Karta pojedynczego ZKO (max 200 linii)
- Wyświetla: numer, status, postęp, kooperanta
- Statystyki: pozycje, palety, formatki, waga
- Szybkie akcje: podgląd, workflow

### ZKOListFilters
**Lokalizacja:** `components/ZKOListFilters/`
- Kompaktowy komponent filtrów
- Filtry: status, priorytet, kooperant
- Przycisk czyszczenia filtrów

### ZKOListStats
**Lokalizacja:** `components/ZKOListStats/`
- Pasek ze statystykami wszystkich ZKO
- Karty: wszystkie, nowe, w realizacji, zakończone, pilne
- Animowane przy ładowaniu

## 🔄 Komponenty Workflow

### StatusChangeButton ✅ NAPRAWIONY (03.09.2025)
**Lokalizacja:** `components/StatusChangeButton.tsx`
- Przycisk zmiany statusu ZKO z modalem
- **Naprawiono:** Teraz poprawnie pobiera listę dostępnych kroków z `/api/workflow/next-steps/:id`
- **Funkcje:**
  - Dynamiczne pobieranie następnych etapów workflow
  - Walidacja możliwości zmiany statusu
  - Obsługa błędów i ostrzeżeń
  - Przyjazne ikony i opisy dla każdego etapu
- **Użyte endpointy:**
  - `GET /api/workflow/next-steps/:id` - pobieranie dostępnych kroków
  - `PUT /api/zko/:id/status` - zmiana statusu

## 🎨 Style

### Design System
- **Kolory statusów:** zgodne z workflow
- **Ikony:** Ant Design Icons + emoji dla priorytetów
- **Karty:** białe z subtelnymi cieniami
- **Hover:** podniesienie karty + zmiana koloru obramowania

### Responsywność
- Desktop: grid 3-4 kolumny
- Tablet: grid 2 kolumny  
- Mobile: lista 1 kolumna

## 📝 Zasady tworzenia komponentów

### Limit linii kodu
- **Max 300 linii** na komponent (zaktualizowano z 200)
- Logika biznesowa → PostgreSQL lub hooks
- Style → osobne pliki CSS lub inline gdy proste

### Struktura plików
```
component/
  ├── index.tsx       (komponent)
  ├── Component.css   (style - opcjonalnie)
  └── types.ts        (opcjonalnie)
```

## 🔧 Użycie

```tsx
// W routingu aplikacji
import { ZKOModernListPage } from '@/modules/zko/pages/ZKOModernListPage';

// Dodaj do routes
<Route path="/zko/modern" element={<ZKOModernListPage />} />

// Użycie StatusChangeButton
import { StatusChangeButton } from '@/modules/zko/components/StatusChangeButton';

<StatusChangeButton
  zkoId={123}
  currentStatus="NOWE"
  onStatusChanged={() => refetch()}
  nextSteps={nextStepsArray} // opcjonalnie
  disabled={false}
/>
```

## 📊 Dane z API

### Endpoint listy
- `GET /api/zko` - lista wszystkich ZKO
- `GET /api/zko/:id/stats` - statystyki pojedynczego ZKO
- `GET /api/zko/summary` - podsumowanie wszystkich

### Endpoint workflow
- `GET /api/workflow/next-steps/:id` - następne kroki dla ZKO
- `PUT /api/zko/:id/status` - zmiana statusu ZKO
- `GET /api/workflow/etapy` - słownik etapów
- `GET /api/workflow/instructions` - instrukcje workflow

### Struktura danych
```typescript
// ZKO
{
  zko: {
    id, numer_zko, status, kooperant, priorytet,
    data_utworzenia, pozycje[], palety[]
  },
  stats: {
    pozycje_count, palety_count, formatki_total,
    plyty_total, waga_total
  }
}

// Next Steps
{
  kod_etapu: string,     // np. "CIECIE", "OKLEJANIE"
  nazwa_etapu: string    // np. "Rozpocznij cięcie"
}
```

## 🚀 Rozwój

### Planowane funkcje
- [ ] Export do Excel
- [ ] Grupowanie po statusie
- [ ] Widok kanban
- [ ] Real-time aktualizacje
- [ ] Drag & drop do zmiany priorytetu

### Ostatnie zmiany
- **03.09.2025** - Naprawiono StatusChangeButton - poprawne pobieranie listy kroków workflow
- **02.09.2025** - Dodano nową stronę listy ZKO w stylu ERP

## 📌 Uwagi
- Komponenty używają hooków z `hooks/index.ts`
- Style zgodne z Ant Design
- Wszystkie teksty po polsku
- Funkcje PostgreSQL w schemacie `zko` obsługują logikę biznesową