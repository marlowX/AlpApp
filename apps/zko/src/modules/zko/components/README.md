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
- **Max 200 linii** na komponent
- Logika biznesowa → PostgreSQL lub hooks
- Style → osobne pliki CSS

### Struktura plików
```
component/
  ├── index.tsx       (komponent)
  ├── Component.css   (style)
  └── types.ts        (opcjonalnie)
```

## 🔧 Użycie

```tsx
// W routingu aplikacji
import { ZKOModernListPage } from '@/modules/zko/pages/ZKOModernListPage';

// Dodaj do routes
<Route path="/zko/modern" element={<ZKOModernListPage />} />
```

## 📊 Dane z API

### Endpoint listy
- `GET /api/zko` - lista wszystkich ZKO
- `GET /api/zko/:id/stats` - statystyki pojedynczego ZKO
- `GET /api/zko/summary` - podsumowanie wszystkich

### Struktura danych
```typescript
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
```

## 🚀 Rozwój

### Planowane funkcje
- [ ] Export do Excel
- [ ] Grupowanie po statusie
- [ ] Widok kanban
- [ ] Real-time aktualizacje
- [ ] Drag & drop do zmiany priorytetu

## 📌 Uwagi
- Komponenty używają hooków z `hooks/index.ts`
- Style zgodne z Ant Design
- Wszystkie teksty po polsku