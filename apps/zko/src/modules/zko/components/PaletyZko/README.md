# 📦 Moduł PaletyZko - Ulepszone Zarządzanie Paletami

## 📅 Data utworzenia: 2025-01-17
## 👤 Autor: marlowX (biuro@alpmeb.pl)
## 🔄 Ostatnia aktualizacja: 2025-01-18

## 🎯 Cel modułu

Nowy, ulepszony moduł do zarządzania paletami w systemie ZKO z fokusem na:
- **Intuicyjne UI** - karty zamiast tabel, drag & drop
- **Poprawne obliczenia** - dokładne wagi, wysokości z uwzględnieniem poziomów
- **Ręczne zarządzanie** - pełna kontrola operatora nad tworzeniem palet
- **Wizualizacja** - jasny przegląd zawartości i statusu palet
- **Zamykanie palet** - finalizacja i oznaczenie jako gotowe do transportu
- **Drukowanie etykiet** - generowanie etykiet z kodem kreskowym

## 🏗️ Struktura modułu

```
PaletyZko/
├── index.tsx                    # Główny komponent (max 300 linii)
├── types.ts                     # Definicje typów TypeScript
├── components/                  # Komponenty UI
│   ├── PozycjaSelector.tsx     # ✅ Wybór pozycji ZKO
│   ├── PaletyStats.tsx         # ✅ Statystyki palet
│   ├── PaletyGridDND.tsx       # ✅ Siatka palet z Drag & Drop
│   ├── PaletaCardDND.tsx       # ✅ Karta palety z przyciskami akcji
│   ├── CreatePaletaModal.tsx   # ✅ Modal tworzenia palety
│   ├── PaletaDetails.tsx       # ✅ Szczegóły palety
│   ├── FormatkaSelectorDND.tsx # ✅ Lista formatek do przeciągania
│   └── index.ts                 # ✅ Export komponentów
├── hooks/                       # React hooks
│   ├── usePalety.ts            # ✅ Zarządzanie paletami + drukowanie
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

## ⚡ Nowe funkcjonalności (18.01.2025)

### 1. **Zamykanie palet** ✅
- Przycisk zamknięcia dostępny dla palet z formatkami
- Status zmienia się na "gotowa_do_transportu"
- Paleta staje się niemodyfikowalna
- Wizualne oznaczenie zamkniętych palet (żółte tło)

### 2. **Drukowanie etykiet** ✅
- Przycisk drukowania dla zamkniętych palet
- Etykieta zawiera:
  - Numer palety (z kodem kreskowym)
  - Numer ZKO
  - Przeznaczenie
  - Ilość formatek
  - Wagę i wysokość
  - Kolory płyt
  - Daty utworzenia i zamknięcia
  - Operatora
- Format A6 gotowy do druku na drukarce etykiet

### 3. **Poprawione obliczenia wag** ✅
- Prawidłowe pobieranie wartości z bazy danych
- Obsługa różnych nazw pól (waga_kg, waga_total)
- Dokładne obliczenia na podstawie wymiarów formatek
- Uwzględnienie gęstości płyty (650 kg/m³)

### 4. **Ulepszone UI** ✅
- Ikony stanu palety (zamknięta/otwarta)
- Kolorowe paski postępu (zielony/żółty/czerwony)
- Menu kontekstowe z dodatkowymi akcjami
- Lepsze grupowanie palet po przeznaczeniu

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
3. **Tworzenie palety** - Klik "Nowa paleta" lub "Pusta paleta"
4. **Konfiguracja** - Wybór przeznaczenia i limitów
5. **Dodawanie formatek** - Drag & drop formatek na palety
6. **Monitoring** - Śledzenie wypełnienia w czasie rzeczywistym
7. **Zamknięcie** - Klik na przycisk ✓ gdy paleta gotowa
8. **Drukowanie** - Klik na ikonę drukarki dla etykiety

## 🛠️ Funkcje PostgreSQL wykorzystywane

### Główne:
- `pal_utworz_reczna_palete_v2` - tworzenie ręcznej palety
- `pal_edytuj` - edycja zawartości palety
- `pal_przenies_formatki` - przenoszenie formatek
- `pal_zamknij` - zamknięcie palety ✅
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
5. **Zamknięte palety** nie mogą być edytowane - tylko usunięte lub wydrukowane

## 🐛 Rozwiązane problemy

1. ✅ Poprawione liczenie wysokości (poziomy zamiast stosu)
2. ✅ Dokładne wagi formatek z różnych źródeł
3. ✅ Czytelne kolory i przeznaczenia
4. ✅ Intuicyjne UI z kartami zamiast tabel
5. ✅ Drag & drop między paletami
6. ✅ Zamykanie palet z blokowaniem edycji
7. ✅ Drukowanie etykiet z kodem kreskowym

## 📈 Metryki sukcesu

- Wysokości palet < 1440mm (realistyczne)
- Wagi palet < 700kg (bezpieczne)
- Czas utworzenia palety < 30 sekund
- Zero błędów przy przekroczeniu limitów
- 100% formatek przypisanych do palet
- Etykiety drukowane w < 5 sekund

## 🔄 Status rozwoju

### ✅ Ukończone (18.01.2025):
- [x] Struktura modułu
- [x] Typy TypeScript (types.ts)
- [x] Funkcje obliczeniowe (calculations.ts) - POPRAWIONE
- [x] Formattery i walidatory (formatters.ts, validators.ts)
- [x] Hook usePalety - zarządzanie paletami + ZAMYKANIE + DRUKOWANIE
- [x] Hook useFormatki - zarządzanie formatkami
- [x] Hook useDragDrop - obsługa przeciągania
- [x] Komponent główny (index.tsx)
- [x] PozycjaSelector - wybór pozycji ZKO
- [x] PaletyStats - statystyki
- [x] PaletyGridDND - siatka palet z drag & drop
- [x] PaletaCardDND - karta palety Z PRZYCISKAMI AKCJI
- [x] CreatePaletaModal - tworzenie palety
- [x] PaletaDetails - szczegóły palety
- [x] FormatkaSelectorDND - lista formatek
- [x] Przycisk zamykania palety
- [x] Drukowanie etykiet
- [x] Poprawione obliczenia wag

### 🚧 Do zrobienia:
- [ ] Testy jednostkowe
- [ ] Wizualizator 3D układu formatek
- [ ] Eksport do PDF/Excel zbiorczy
- [ ] Optymalizacja wydajności dla > 100 palet
- [ ] Integracja z czytnikiem kodów kreskowych
- [ ] Historia zmian palety

## 💡 Uwagi implementacyjne

### API Endpoints (wykorzystywane):
- `/api/pallets/:id/close` - zamykanie palety ✅
- `/api/pallets/:id` - szczegóły palety (dla drukowania) ✅
- `/api/zko/:id` - dane ZKO (dla etykiety) ✅
- `/api/pallets/manual/*` - ręczne zarządzanie
- `/api/pallets/zko/:id/details` - lista palet dla ZKO

### Komponenty do ewentualnej migracji:
- PaletaVisualizer - wizualizacja 3D
- ExportManager - eksport danych
- HistoryViewer - przeglądanie historii
- BarcodeScanner - skanowanie kodów

---

**Wersja:** 1.2.0  
**Data aktualizacji:** 2025-01-18  
**Status:** 95% ukończone - w pełni funkcjonalne
**Autor zmian:** marlowX (biuro@alpmeb.pl)
