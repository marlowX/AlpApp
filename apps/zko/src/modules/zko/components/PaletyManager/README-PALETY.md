# 📦 README-PALETY: System Zarządzania Paletami - Dokumentacja Kompletna

## 📅 Historia Rozwoju i Rozwiązanych Problemów

### ✅ **ROZWIĄZANE PROBLEMY:**
## ⚠️ KRYTYCZNE: Sprawdzanie powiązań między tabelami (Foreign Keys)
Komponenty do palet sa w katalogu D:\PROJEKTY\PROGRAMOWANIE\AlpApp\apps\zko\src\modules\zko\components\PaletyManager\components

## ⚠️ KRYTYCZNE: Zasady tworzenia komponentów

### 📏 Limit 300 linii kodu
- **Każdy komponent może mieć maksymalnie 300 linii kodu**
- Jeśli komponent przekracza ten limit, należy go rozbić na podkomponenty
- Podkomponenty umieszczamy w katalogu `components/` 
- Logikę biznesową przenosimy do PostgreSQL lub custom hooks



### 🔴 PRZED USUWANIEM DANYCH ZAWSZE SPRAWDŹ POWIĄZANIA!
## 🗄️ WAŻNE: Logika biznesowa w PostgreSQL

### 📌 Zasada podstawowa
**PRZED ROZPOCZĘCIEM PRACY ZAWSZE SPRAWDŹ FUNKCJE I WIDOKI W BAZIE DANYCH**

Logika biznesowa systemu ZKO jest zaimplementowana w bazie danych PostgreSQL poprzez:
- **Funkcje składowane** - cała logika obliczeniowa i walidacyjna
- **Widoki** - przygotowane zestawienia danych
- **Triggery** - automatyczne akcje przy zmianach danych
- **Procedury** - złożone operacje biznesowe

Nie przepisuj calych plików na nowo tylko modyfikuj w miejscach , tak by nie potrzebnie przpisywac to samo!!!
dotyczy się tez plików README.md - dodawaj dopisuj, poprawiaj a nie przpisuj od nowa!!

PostgreSQL używa **Foreign Key Constraints** do zachowania integralności danych. Gdy próbujesz usunąć rekord, który jest powiązany z innymi tabelami, otrzymasz błąd który **NIE JEST WIDOCZNY W KONSOLI PRZEGLĄDARKI** - tylko "500 Internal Server Error".

### Przykład problemu z paletami:
```sql
-- ❌ TO NIE ZADZIAŁA jeśli istnieją powiązania:
DELETE FROM zko.palety WHERE id = 123;
-- ERROR: update or delete on table "palety" violates foreign key constraint

-- ✅ POPRAWNE ROZWIĄZANIE:
-- Najpierw usuń powiązane rekordy
DELETE FROM zko.palety_historia WHERE paleta_id = 123;
-- Dopiero potem usuń paletę
DELETE FROM zko.palety WHERE id = 123;

### Tabele z powiązaniami w module Palety:
- `zko.palety` → `zko.palety_historia` (historia zmian)
- `zko.palety` → `zko.transport_palety` (transport)
- `zko.palety` → `zko.palety_formatki` (przypisania formatek)
- `zko.palety` → `zko.palety_formatki_ilosc` (ilości formatek) **🆕 NOWA TABELA**

### 🛡️ Zasady bezpieczeństwa:
1. **Zawsze sprawdzaj powiązania** przed DELETE
2. **Używaj kaskadowego usuwania** gdy to możliwe
3. **Loguj błędy backendu** - tam widać prawdziwe komunikaty SQL
4. **Testuj funkcje w pgAdmin** przed implementacją



```
#### 1. **Problem z liczeniem wysokości palet (2025-08-30)**
- **Problem:** System liczył wysokość jako `sztuki × grubość` (np. 80 × 18mm = 1440mm)
- **Przyczyna:** Błędne założenie że formatki układa się jedna na drugiej
- **Rozwiązanie:** Formatki układane obok siebie na poziomach (4/poziom)
- **Wynik:** 80 sztuk = 20 poziomów × 18mm = 360mm (realistyczna wysokość)
- **Naprawione funkcje:**
  - `pal_helper_oblicz_parametry` - liczy poziomy
  - `pal_planuj_modularnie` - używa prawidłowej wysokości

#### 2. **Problem z ilościami formatek w V5**
- **Problem:** System traktował ID formatek jako sztuki
- **Przyczyna:** Funkcje V5 nie sprawdzały kolumny `ilosc_planowana`
- **Rozwiązanie:** Nowe funkcje modularne i tabela `palety_formatki_ilosc`
- **Status:** V5 nadal ma błąd, używaj V2 Modular

#### 3. **Problem z Foreign Key Constraints**
- **Problem:** Błąd 500 przy usuwaniu palet bez komunikatu
- **Przyczyna:** Powiązania między tabelami (palety → palety_historia)
- **Rozwiązanie:** Funkcja `pal_helper_usun_palety` obsługuje FK
- **Zasada:** ZAWSZE sprawdzaj powiązania przed DELETE

### 🆕 **NOWE FUNKCJONALNOŚCI (2025-08-30):**

## 🎯 Ręczne Zarządzanie Paletami - NOWA FUNKCJONALNOŚĆ

### Koncepcja
System pozwala operatorowi na pełną kontrolę nad tworzeniem palet podczas dodawania pozycji do ZKO. Zamiast automatycznego planowania, operator ręcznie decyduje:
- Ile utworzyć palet
- Które formatki na którą paletę
- Jakie jest przeznaczenie każdej palety
- Kontroluje wagę i wysokość w czasie rzeczywistym

### Komponenty systemu

#### Frontend - ManualPalletCreator
**Lokalizacja:** `apps/zko/src/modules/zko/components/PaletyManager/components/ManualPalletCreator.tsx`

**Funkcje:**
- Tworzenie palet na żądanie (przycisk "Nowa paleta")
- Przypisywanie formatek z kontrolą pozostałych ilości
- Monitorowanie wagi i wysokości w czasie rzeczywistym
- Oznaczanie przeznaczenia palety
- Kopiowanie i usuwanie palet
- Ostrzeżenia przy przekroczeniu 90% limitów

**Przeznaczenia palet:**
- MAGAZYN - standardowe składowanie
- OKLEINIARKA - do procesu oklejania  
- WIERCENIE - do obróbki CNC
- CIECIE - do dalszego cięcia
- WYSYLKA - gotowa do transportu

#### Backend - PostgreSQL
**Funkcja:** `zko.pal_utworz_reczna_palete`
**Parametry:**
- `p_pozycja_id` - ID pozycji
- `p_formatki` - JSON z formatkami [{formatka_id, ilosc}]
- `p_przeznaczenie` - gdzie trafi paleta
- `p_max_waga` - limit wagi (domyślnie 700kg)
- `p_max_wysokosc` - limit wysokości (domyślnie 1440mm)

**Nowe kolumny w tabeli `palety`:**
- `przeznaczenie` - kierunek palety w procesie
- `max_waga_kg` - limit wagi dla palety
- `max_wysokosc_mm` - limit wysokości

#### API Endpoints
- `POST /api/pallets/manual/create` - tworzenie pojedynczej palety
- `POST /api/pallets/manual/batch` - tworzenie wielu palet
- `GET /api/pallets/position/:pozycjaId` - pobieranie palet pozycji
- `PUT /api/pallets/:paletaId/destination` - zmiana przeznaczenia

### Workflow pracy

1. **Operator dodaje pozycję do ZKO**
2. **System pokazuje formatki do rozplanowania**
3. **Operator tworzy pierwszą paletę**
4. **Wybiera przeznaczenie** (np. Okleiniarka)
5. **Dodaje formatki** klikając "Dodaj" i wpisując ilość
6. **System liczy w czasie rzeczywistym:**
   - Aktualną wagę vs limit
   - Wysokość stosu vs limit
   - Pokazuje paski postępu
7. **Gdy paleta pełna** - tworzy kolejną
8. **Różne przeznaczenia** - może mieć palety do różnych procesów
9. **Zapisuje wszystkie** jednym przyciskiem

### Gdzie to jest w aplikacji

**Ścieżka:** ZKO → Szczegóły → Zarządzanie paletami → zakładka "Ręczne tworzenie"

**Zakładki w PaletyManager:**
1. "Planowanie automatyczne" - dotychczasowe funkcje (V2, V5)
2. "Ręczne tworzenie" - nowy tryb ręcznego zarządzania
3. "Przeznaczenie palet" - przegląd według przeznaczenia

## 📊 Wizualizacja Układu Formatek - NOWA FUNKCJONALNOŚĆ

### Komponenty wizualizacji

#### PaletaVisualizer
**Lokalizacja:** `apps/zko/src/modules/zko/components/PaletyManager/components/PaletaVisualizer.tsx`

**Funkcje:**
- 3 widoki: z góry, 3D izometryczny, z boku
- Obsługa rzeczywistych danych z palety
- Układanie różnych rozmiarów obok siebie
- Automatyczne obracanie dla lepszego wykorzystania
- Kolorowanie według typów formatek

**Tryby pracy:**
- Tryb rzeczywistych danych - używa danych z palety
- Tryb symulacji - testowanie parametrów
- Tryb mieszany - różne rozmiary na palecie

**Integracja:**
- W PaletaDetails - zakładka "Wizualizacja"
- Pokazuje jak formatki układają się na palecie
- Ostrzeżenia o przekroczeniu limitów

### Przykład układania różnych rozmiarów
```
Paleta EURO 1200×800mm - jeden poziom:
[496×337] [496×337] [200×337]  <- rząd 1
[996×337]           [200×337]  <- rząd 2
[600×300] [600×300]            <- rząd 3
```

## 📈 Strategie i Wersje Planowania

### Porównanie wersji

| Wersja | Status | Problem | Zalecenie |
|--------|--------|---------|-----------|
| V4 | Deprecated | Stara logika | Nie używać |
| V5 | Błędna | Źle liczy ilości | Nie używać |
| V2 Modular | ✅ Działa | Brak | **UŻYWAJ TEJ** |
| Ręczne | ✅ Nowe | Brak | Dla kontroli |

### Strategie planowania V2

1. **Modularyczne** - proporcjonalne rozłożenie
2. **Kolory** - grupowanie po kolorach (każda paleta = jeden kolor)

### Funkcje pomocnicze (modularne)
- `pal_helper_policz_sztuki` - liczy rzeczywiste sztuki
- `pal_helper_oblicz_parametry` - oblicza parametry z poziomami
- `pal_helper_usun_palety` - usuwa z obsługą FK
- `pal_helper_utworz_palete` - tworzy pojedynczą paletę

## 🔧 Limity i Parametry

### Limity systemowe
```
MAX_WYSOKOSC_MM: 1440 (standard EURO)
MAX_WAGA_KG: 700 (bezpieczny transport)
FORMATEK_NA_POZIOM: 4 (średnio dla 600×300)
GRUBOSC_PLYTY: 18mm (standard)
```

### Obliczanie wysokości - PRAWIDŁOWE
```
Formatki: 80 sztuk
Formatek na poziom: 4
Liczba poziomów: 80 ÷ 4 = 20
Wysokość: 20 × 18mm = 360mm ✅
```

### Obliczanie wysokości - BŁĘDNE (jak było)
```
Formatki: 80 sztuk
Wysokość: 80 × 18mm = 1440mm ❌ (nierealistyczne!)
```

## 🚨 Ważne Zasady i Ostrzeżenia

### Foreign Key Constraints
**ZAWSZE** przed usunięciem sprawdź powiązania:
```sql
-- Sprawdź co wskazuje na palety
SELECT * FROM zko.palety_historia WHERE paleta_id = ?;
SELECT * FROM zko.palety_formatki_ilosc WHERE paleta_id = ?;
```

### Tabela palety_formatki_ilosc
**KRYTYCZNA** dla poprawnego liczenia:
- Przechowuje rzeczywiste ilości formatek na paletach
- Wypełniana przez funkcje V2 Modular
- NIE jest wypełniana przez V5 (błąd!)

### Wysokość palety
**PAMIĘTAJ:** Formatki układa się obok siebie na poziomach, nie jedna na drugiej!

## 📋 Checklisty

### Przed planowaniem palet
- [ ] Sprawdź czy ZKO ma formatki
- [ ] Sprawdź limity wagi i wysokości
- [ ] Wybierz strategię (modular/kolory/ręczne)
- [ ] Zdecyduj o przeznaczeniu palet

### Przy ręcznym tworzeniu
- [ ] Oznacz przeznaczenie każdej palety
- [ ] Kontroluj wagę (max 700kg)
- [ ] Kontroluj wysokość (max 1440mm)
- [ ] Sprawdź czy wszystkie formatki przypisane

### Przy debugowaniu
- [ ] Sprawdź logi backendu (prawdziwe błędy SQL)
- [ ] Sprawdź Foreign Keys przy błędzie 500
- [ ] Sprawdź tabelę palety_formatki_ilosc
- [ ] Użyj pgAdmin dla testów SQL

## 🎯 Zalecenia

### Dla operatorów
1. **Używaj "Planuj V2"** dla automatycznego planowania
2. **Używaj "Ręczne tworzenie"** gdy potrzebujesz kontroli
3. **Oznaczaj przeznaczenie** palet od razu
4. **Kontroluj limity** wagi i wysokości

### Dla developerów
1. **NIE używaj V5** - ma błąd z ilościami
2. **Używaj funkcji modularnych** - łatwiejsze debugowanie
3. **Testuj w pgAdmin** przed implementacją
4. **Loguj błędy backendu** - tam są prawdziwe komunikaty

## 📊 Metryki Sukcesu

- ✅ Wysokości palet realistyczne (360mm zamiast 1440mm)
- ✅ Ilości formatek poprawnie liczone
- ✅ Operator ma pełną kontrolę przy ręcznym tworzeniu
- ✅ Przeznaczenie palet jasno oznaczone
- ✅ Wizualizacja pokazuje rzeczywiste układanie

## 🔄 Historia Commitów

1. **fix(palety): Naprawiono liczenie wysokości w planowaniu V2**
2. **feat(palety): Dodano wizualizator układu formatek**
3. **feat(palety): Ręczne zarządzanie paletami z kontrolą przeznaczenia**

---

**Autor:** marlowX  
**Email:** biuro@alpmeb.pl  
**Data aktualizacji:** 2025-08-30  
**Wersja:** 3.0 - Ręczne Zarządzanie + Wizualizacja

---

## Podsumowanie najważniejszych ustaleń

1. **Formatki układa się OBOK SIEBIE** na poziomach, nie jedna na drugiej
2. **Używaj V2 Modular**, nie V5 (błąd z ilościami)
3. **Ręczne tworzenie** daje pełną kontrolę operatorowi
4. **Przeznaczenie palety** określa gdzie trafi w procesie
5. **Tabela palety_formatki_ilosc** jest kluczowa dla poprawnego liczenia
6. **Foreign Keys** mogą blokować usuwanie - zawsze sprawdzaj
7. **Wizualizator** pokazuje rzeczywiste układanie formatek
