# 📦 Moduł PaletyZko - Ulepszone Zarządzanie Paletami

## 📅 Data utworzenia: 2025-01-17
## 👤 Autor: marlowX (biuro@alpmeb.pl)

## 🎯 Cel modułu

Nowy, ulepszony moduł do zarządzania paletami w systemie ZKO z fokusem na:
- **Intuicyjne UI** - karty zamiast tabel, drag & drop
- **Poprawne obliczenia** - dokładne wagi, wysokości z uwzględnieniem poziomów
- **Ręczne zarządzanie** - pełna kontrola operatora nad tworzeniem palet
- **Wizualizacja** - jasny przegląd zawartości i statusu palet

## 🏗️ Struktura modułu

```
PaletyZko/
├── index.tsx                    # Główny komponent (max 300 linii)
├── types.ts                     # Definicje typów TypeScript
├── components/                  # Komponenty UI
│   ├── PozycjaSelector.tsx     # ✅ Wybór pozycji ZKO
│   ├── PaletyStats.tsx         # ✅ Statystyki palet
│   ├── PaletyGrid.tsx          # ✅ Siatka palet
│   ├── PaletaCard.tsx          # ✅ Karta pojedynczej palety
│   ├── CreatePaletaModal.tsx   # ✅ Modal tworzenia palety
│   ├── PaletaDetails.tsx       # ✅ Szczegóły palety
│   ├── FormatkaSelector.tsx    # ✅ Lista formatek do dodania
│   └── index.ts                 # ✅ Export komponentów
├── hooks/                       # React hooks
│   ├── usePalety.ts            # ✅ Zarządzanie paletami
│   ├── useFormatki.ts          # ✅ Zarządzanie formatkami
│   ├── useDragDrop.ts          # ✅ Obsługa drag & drop
│   └── index.ts                # ✅ Export hooków
├── utils/                       # Funkcje pomocnicze
│   ├── calculations.ts         # ✅ Obliczenia (waga, wysokość)
│   ├── formatters.ts          # ✅ Formatowanie danych
│   ├── validators.ts          # ✅ Walidacja
│   └── index.ts               # ✅ Export utils
└── README.md                   # ✅ Dokumentacja

```

## ⚡ Kluczowe funkcjonalności

### 1. **Poprawne obliczenia wysokości** ✅
- Formatki układane są OBOK SIEBIE na poziomach (4 formatki/poziom)
- Wysokość = liczba_poziomów × grubość_płyty
- NIE: liczba_formatek × grubość (błąd w starym module)

### 2. **Ręczne tworzenie palet** ✅
- Operator tworzy pustą paletę
- Wybiera przeznaczenie (Magazyn/Okleiniarka/Wiercenie/etc)
- Dodaje formatki z kontrolą limitów w czasie rzeczywistym
- Widzi paski postępu dla wagi i wysokości

### 3. **Drag & Drop** ✅
- Przeciąganie formatek między paletami
- Wizualna informacja zwrotna podczas przeciągania
- Automatyczna walidacja limitów przed upuszczeniem

### 4. **Wizualizacja kolorów** ✅
- Kolorowe znaczniki dla różnych płyt
- Mapowanie kodów kolorów na nazwy i kolory HEX
- Wyświetlanie kolorów na kartach palet

### 5. **Statystyki w czasie rzeczywistym** ✅
- Podsumowanie wszystkich palet
- Grupowanie po przeznaczeniu
- Procent wykorzystania (waga/wysokość)
- Liczba dostępnych formatek

## 🔧 Limity systemowe

```typescript
const LIMITY_PALETY = {
  MAX_WAGA_KG: 700,           // Maksymalna waga palety
  MAX_WYSOKOSC_MM: 1440,      // Maksymalna wysokość stosu
  GRUBOSC_PLYTY_MM: 18,       // Standardowa grubość płyty
  FORMATEK_NA_POZIOM: 4,      // Średnia liczba formatek na poziom
  PALETA_SZERKOSC_MM: 1200,   // Szerokość palety EURO
  PALETA_DLUGOSC_MM: 800      // Długość palety EURO
};
```

## 🚀 Użycie modułu

```tsx
import { PaletyZko } from '@/modules/zko/components/PaletyZko';

// W komponencie ZKO
<PaletyZko 
  zkoId={123} 
  onRefresh={() => fetchZkoData()} 
/>
```

## 📊 Workflow pracy

1. **Wybór pozycji** - Operator wybiera pozycję ZKO z selektora
2. **Podgląd formatek** - System pokazuje dostępne formatki
3. **Tworzenie palety** - Klik "Nowa paleta"
4. **Konfiguracja** - Wybór przeznaczenia i limitów
5. **Dodawanie formatek** - Drag & drop lub przyciski +/-
6. **Monitoring** - Śledzenie wypełnienia w czasie rzeczywistym
7. **Zamknięcie** - Finalizacja palety gdy gotowa

## 🛠️ Funkcje PostgreSQL wykorzystywane

### Główne:
- `pal_utworz_reczna_palete_v2` - tworzenie ręcznej palety
- `pal_edytuj` - edycja zawartości palety
- `pal_przenies_formatki` - przenoszenie formatek
- `pal_zamknij` - zamknięcie palety
- `pal_helper_oblicz_parametry` - obliczenia parametrów

### Pomocnicze:
- `pal_oblicz_parametry_v2` - szczegółowe parametry
- `pal_helper_usun_palety` - usuwanie z obsługą FK
- `loguj_zmiane_palety` - historia zmian

## ⚠️ Ważne uwagi

1. **NIE używaj funkcji V5** - mają błąd z liczeniem ilości
2. **Używaj V2 Modular** dla automatycznego planowania
3. **Sprawdzaj Foreign Keys** przed usuwaniem (palety_historia, palety_formatki_ilosc)
4. **Tabela palety_formatki_ilosc** jest kluczowa dla poprawnego liczenia

## 🐛 Rozwiązane problemy

1. ✅ Poprawione liczenie wysokości (poziomy zamiast stosu)
2. ✅ Dokładne wagi formatek
3. ✅ Czytelne kolory i przeznaczenia
4. ✅ Intuicyjne UI z kartami zamiast tabel
5. ✅ Drag & drop między paletami

## 📈 Metryki sukcesu

- Wysokości palet < 1440mm (realistyczne)
- Wagi palet < 700kg (bezpieczne)
- Czas utworzenia palety < 30 sekund
- Zero błędów przy przekroczeniu limitów
- 100% formatek przypisanych do palet

## 🔄 Status rozwoju

### ✅ Ukończone (17.01.2025):
- [x] Struktura modułu
- [x] Typy TypeScript (types.ts)
- [x] Funkcje obliczeniowe (calculations.ts)
- [x] Formattery i walidatory (formatters.ts, validators.ts)
- [x] Hook usePalety - zarządzanie paletami
- [x] Hook useFormatki - zarządzanie formatkami
- [x] Hook useDragDrop - obsługa przeciągania
- [x] Komponent główny (index.tsx)
- [x] PozycjaSelector - wybór pozycji ZKO
- [x] PaletyStats - statystyki
- [x] PaletyGrid - siatka palet
- [x] PaletaCard - karta palety
- [x] CreatePaletaModal - tworzenie palety
- [x] PaletaDetails - szczegóły palety
- [x] FormatkaSelector - lista formatek

### 🚧 Do zrobienia:
- [ ] Integracja z istniejącymi endpointami API
- [ ] Testy jednostkowe
- [ ] Wizualizator 3D układu formatek
- [ ] Eksport do PDF/Excel
- [ ] Optymalizacja wydajności dla > 100 palet

## 📝 Kolejne kroki

1. **Integracja z API** - połączenie hooków z endpointami w `/services/zko-service/src/routes/pallets/`
2. **Testowanie** - sprawdzenie działania wszystkich funkcjonalności
3. **Wizualizator** - dodanie komponentu 3D pokazującego układ formatek
4. **Eksport** - generowanie raportów PDF i Excel
5. **Deployment** - wdrożenie do produkcji

## 💡 Uwagi implementacyjne

### API Endpoints (już istniejące):
- `/api/pallets/manual/*` - ręczne zarządzanie (manual.routes.ts)
- `/api/pallets/modular/*` - planowanie modularne (modular.routes.ts)
- `/api/pallets/details/*` - szczegóły palet (details.routes.ts)
- `/api/pallets/manage/*` - zarządzanie ogólne (manage.routes.ts)

### Komponenty do ewentualnej migracji ze starego modułu:
- PaletaVisualizer - wizualizacja 3D
- ExportManager - eksport danych
- HistoryViewer - przeglądanie historii

---

**Wersja:** 1.1.0  
**Data aktualizacji:** 2025-01-17  
**Status:** 90% ukończone - gotowe do integracji z API
