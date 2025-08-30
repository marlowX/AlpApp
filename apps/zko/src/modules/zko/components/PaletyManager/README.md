# 📦 PaletyManager V5 - Dokumentacja

## 🚨 INSTALACJA FUNKCJI V5 - WAŻNE!

### Szybka instalacja (Windows):
```bash
# Z głównego katalogu AlpApp
quick-install-palety-v5.bat
```

### Ręczna instalacja (PostgreSQL):
```sql
-- Zaloguj się do bazy alpsys
psql -h localhost -p 5432 -d alpsys

-- Wykonaj skrypty
\i D:/PROJEKTY/PROGRAMOWANIE/AlpApp/database/functions/palety_v5.sql
\i D:/PROJEKTY/PROGRAMOWANIE/AlpApp/database/functions/palety_management_v5.sql
```

### Weryfikacja instalacji:
```bash
# Test funkcji w bazie
test-palety-v5.bat

# Lub przez API
curl http://localhost:5001/api/pallets/functions/check
```

## 🚀 NAJWAŻNIEJSZE ZMIANY W V5

### ✨ Nowe funkcjonalności:
- **Inteligentne strategie planowania** - 6 różnych algorytmów
- **Automatyczne presets** - gotowe ustawienia dla różnych typów produkcji
- **Inteligentne usuwanie** - z automatycznym przenoszeniem formatek
- **Reorganizacja palet** - optymalizacja istniejących układów
- **Lepsze walidacje** - sprawdzanie limitów przed operacjami
- **Szczegółowe statystyki** - procent wykorzystania, wagi, etc.

### 🔧 Ulepszone funkcje PostgreSQL:
- `pal_planuj_inteligentnie_v5()` - Nowy algorytm planowania
- `pal_usun_inteligentnie()` - Inteligentne usuwanie z transferem formatek
- `pal_reorganizuj_v5()` - Reorganizacja z optymalizacją
- `pal_wyczysc_puste_v2()` - Ulepszone czyszczenie pustych palet

## 🗄️ WAŻNE: Logika biznesowa w PostgreSQL

### 📌 Zasada podstawowa
**PRZED ROZPOCZĘCIEM PRACY ZAWSZE SPRAWDŹ FUNKCJE I WIDOKI W SCHEMACIE `zko`**

Logika biznesowa zarządzania paletami jest zaimplementowana w bazie danych PostgreSQL w schemacie `zko` poprzez:
- **Funkcje składowane V5** - nowe algorytmy z inteligentnymi strategiami
- **Widoki** - gotowe zestawienia i raporty o paletach
- **Triggery** - automatyczne generowanie numerów palet i historia zmian
- **Procedury** - złożone operacje logistyczne

## 📊 Nowe funkcje PostgreSQL V5

### Planowanie i tworzenie palet V5
| Funkcja | Opis | Nowe parametry | Zwraca |
|---------|------|-----------------|---------|
| `pal_planuj_inteligentnie_v5()` | 🆕 Nowy algorytm z 6 strategiami | strategia, uwzglednij_oklejanie, nadpisz_istniejace | plan + statystyki + szczegóły |
| `pal_utworz_palety()` | Tworzenie pustych palet | zko_id, operator | sukces, komunikat, palety_utworzone |

### Zarządzanie formatkami V5 (ulepszone)
| Funkcja | Opis | Ulepszone funkcje | Zwraca |
|---------|------|-------------------|---------|
| `pal_przesun_formatki()` | Przenoszenie - lepsze walidacje | sprawdzanie statusów, logowanie | sukces + szczegółowe info |
| `pal_usun_inteligentnie()` | 🆕 Inteligentne usuwanie | auto-transfer formatek, tylko puste, force | sukces + przeniesione + ostrzeżenia |
| `pal_reorganizuj_v5()` | 🆕 Reorganizacja układu | różne strategie reorganizacji | przed/po + szczegóły |

### Obliczenia i optymalizacja V5
| Funkcja | Opis | Nowe obliczenia | Zwraca |
|---------|------|-----------------|---------|
| `pal_oblicz_parametry_v4()` | Kompleksowe obliczenia | procent wykorzystania, płyty teoretyczne vs rzeczywiste | wszystkie parametry + optymalizacje |
| `pal_wyczysc_puste_v2()` | 🆕 Czyszczenie z detalami | statystyki usuniętych, cross-ZKO | sukces + szczegóły + lista usuniętych |

## 🎯 Nowe strategie planowania V5

### 1. 🤖 Inteligentna (zalecana)
```sql
SELECT * FROM zko.pal_planuj_inteligentnie_v5(
  p_zko_id := 123,
  p_strategia := 'inteligentna',
  p_uwzglednij_oklejanie := true
);
```
**Co robi:**
- Najpierw formatki wymagające oklejania
- Grupuje po kolorach
- Optymalizuje wykorzystanie przestrzeni
- Uwzględnia rozmiary (duże na dół)

### 2. 🎨 Kolor
**Idealne dla:** Transportu do klienta, łatwej identyfikacji
- Każda paleta = jeden kolor
- Łatwe rozpoznanie i sortowanie

### 3. 📏 Rozmiar  
**Idealne dla:** Stabilności transportu
- Duże formatki na dole
- Małe na górze
- Optymalna stabilność

### 4. ✨ Oklejanie
**Idealne dla:** Procesu oklejania
- Formatki do oklejania na osobnych paletach
- Priorytet dla procesu oklejarni
- Łatwiejsze zarządzanie kolejką

### 5. 📦 Optymalizacja
**Idealne dla:** Maksymalnego wykorzystania
- Najlepsza gęstość pakowania
- Minimalna liczba palet
- Maksymalne wykorzystanie przestrzeni

### 6. 🔀 Mieszane
**Idealne dla:** Małych zleceń
- Różne kolory/rozmiary na jednej palecie
- Minimalna liczba palet

## ⚙️ Nowa integracja z React V5

```typescript
// 1. PLANOWANIE Z NOWĄ STRATEGIĄ
const planujPaletyV5 = async (zkoId: number, params: PlanowaniePaletParams) => {
  const response = await fetch(`/api/pallets/zko/${zkoId}/plan-v5`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      strategia: 'inteligentna',  // 🆕 6 strategii do wyboru
      max_wysokosc_mm: 1440,
      max_formatek_na_palete: 200,
      max_waga_kg: 700,
      grubosc_plyty: 18,
      typ_palety: 'EURO',
      uwzglednij_oklejanie: true,  // 🆕 uwzględnianie oklejania
      nadpisz_istniejace: false   // 🆕 kontrola nadpisywania
    })
  });
  
  const result = await response.json();
  
  if (result.sukces) {
    console.log(`Utworzono ${result.palety_utworzone.length} palet`);
    console.log('Statystyki:', result.statystyki);
    console.log('Plan:', result.plan_szczegolowy);
  }
  
  return result;
};

// 2. INTELIGENTNE USUWANIE Z TRANSFEREM
const usunInteligentnie = async (zkoId: number, tylkoPuste = false) => {
  const response = await fetch(`/api/pallets/zko/${zkoId}/delete-smart`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tylko_puste: tylkoPuste,        // 🆕 opcja tylko pustych
      force_usun: false,              // 🆕 wymuszenie usunięcia
      operator: 'user'
    })
  });
  
  const result = await response.json();
  
  if (result.sukces) {
    console.log(`Usunięto ${result.usuniete_palety.length} palet`);
    console.log(`Przeniesiono ${result.przeniesione_formatki} formatek`);
    
    if (result.ostrzezenia.length > 0) {
      console.warn('Ostrzeżenia:', result.ostrzezenia);
    }
  }
  
  return result;
};

// 3. REORGANIZACJA PALET
const reorganizujPalety = async (zkoId: number) => {
  const response = await fetch(`/api/pallets/zko/${zkoId}/reorganize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      strategia: 'optymalizacja',  // 🆕 różne strategie reorganizacji
      operator: 'user'
    })
  });
  
  const result = await response.json();
  
  if (result.sukces) {
    console.log('Przed:', result.przed_reorganizacja);
    console.log('Po:', result.po_reorganizacji);
  }
  
  return result;
};

// 4. ULEPSZONE PRZENOSZENIE Z WALIDACJĄ
const przenieFormatki = async (
  zPaletyId: number, 
  naPaleteId: number, 
  formatkiIds?: number[]
) => {
  const response = await fetch('/api/pallets/transfer-v5', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      z_palety_id: zPaletyId,
      na_palete_id: naPaleteId,
      formatki_ids: formatkiIds,
      operator: 'user',
      powod: 'Przeniesienie przez użytkownika'
    })
  });
  
  const result = await response.json();
  
  if (result.sukces) {
    console.log('Przeniesiono formatki');
    console.log('Z palety:', result.z_palety_info);
    console.log('Na paletę:', result.na_palete_info);
  }
  
  return result;
};
```

## 🎛️ Nowe presets planowania

### Gotowe konfiguracje dla różnych przypadków:

```typescript
const PLANOWANIE_PRESETS = {
  standardowe: {
    // Typowa produkcja - balanced approach
    strategia: 'inteligentna',
    max_wysokosc_mm: 1440,
    max_waga_kg: 700,
    uwzglednij_oklejanie: true
  },
  
  wytrzymale: {
    // Ciężkie płyty - mniej wysokości, więcej wagi
    strategia: 'optymalizacja', 
    max_wysokosc_mm: 1200,
    max_waga_kg: 900,
    grubosc_plyty: 22
  },
  
  oklejanie: {
    // Specjalne dla oklejarni
    strategia: 'oklejanie',
    max_wysokosc_mm: 1000,
    max_formatek_na_palete: 100,
    uwzglednij_oklejanie: true
  },
  
  transport: {
    // Optymalne dla transportu
    strategia: 'kolor',
    max_wysokosc_mm: 1400,
    max_waga_kg: 650
  }
};
```

## 🔄 Nowy workflow pracy z paletami V5

### 1. Planowanie automatyczne
```mermaid
graph LR
    A[Wybór strategii] --> B{Typ produkcji}
    B -->|Standardowa| C[Preset: standardowe]
    B -->|Oklejanie| D[Preset: oklejanie]
    B -->|Transport| E[Preset: transport]
    B -->|Ciężkie| F[Preset: wytrzymałe]
    C --> G[pal_planuj_inteligentnie_v5]
    D --> G
    E --> G
    F --> G
    G --> H[Utworzenie palet]
    H --> I[Statystyki i podsumowanie]
```

### 2. Inteligentne zarządzanie
```mermaid
graph LR
    A[Istniejące palety] --> B{Potrzeba zmian}
    B -->|Reorganizacja| C[pal_reorganizuj_v5]
    B -->|Usunięcie pustych| D[pal_wyczysc_puste_v2]
    B -->|Przeniesienie formatek| E[pal_przesun_formatki]
    B -->|Usunięcie z transferem| F[pal_usun_inteligentnie]
    C --> G[Optymalne palety]
    D --> G
    E --> G
    F --> G
```

### 3. Zaawansowane operacje
```mermaid
graph LR
    A[Problem z paletami] --> B{Diagnoza}
    B -->|Za dużo palet| C[Reorganizacja: optymalizacja]
    B -->|Złe kolory| D[Reorganizacja: kolor]
    B -->|Puste palety| E[Inteligentne usuwanie]
    B -->|Problemy z oklejaniem| F[Reorganizacja: oklejanie]
    C --> G[Rozwiązanie]
    D --> G
    E --> G
    F --> G
```

## 📊 Nowe endpointy API V5

### Planowanie palet
```http
POST /api/pallets/zko/:zkoId/plan-v5
Content-Type: application/json

{
  "strategia": "inteligentna",
  "max_wysokosc_mm": 1440,
  "max_formatek_na_palete": 200,
  "max_waga_kg": 700,
  "grubosc_plyty": 18,
  "typ_palety": "EURO",
  "uwzglednij_oklejanie": true,
  "nadpisz_istniejace": false
}
```

### Inteligentne usuwanie
```http
DELETE /api/pallets/zko/:zkoId/delete-smart
Content-Type: application/json

{
  "tylko_puste": false,
  "force_usun": false,
  "operator": "user"
}
```

### Reorganizacja
```http
POST /api/pallets/zko/:zkoId/reorganize
Content-Type: application/json

{
  "strategia": "optymalizacja",
  "operator": "user"
}
```

### Statystyki
```http
GET /api/pallets/stats/:zkoId

Response:
{
  "sukces": true,
  "statystyki": {
    "liczba_palet": 5,
    "formatki_total": 890,
    "srednie_wykorzystanie": 78,
    "puste_palety": 1,
    "najwyzsze_wykorzystanie": 95,
    "najnizsze_wykorzystanie": 45
  }
}
```

## 🛠️ Troubleshooting V5

### Problem: Błędy podczas planowania palet
**Diagnoza:**
```bash
# Sprawdź dostępność funkcji V5
curl http://localhost:5001/api/pallets/functions/check
```

**Rozwiązanie:**
1. Upewnij się, że funkcje V5 są zainstalowane w bazie
2. Wykonaj: `quick-install-palety-v5.bat`
3. Sprawdź logi backendu pod kątem błędów PostgreSQL

### Problem: Funkcja V5 nie istnieje w bazie
**Rozwiązanie:** 
```bash
# Windows
quick-install-palety-v5.bat

# Lub ręcznie w PostgreSQL
\i database/functions/palety_v5.sql
\i database/functions/palety_management_v5.sql
```

### Problem: Backend nie widzi funkcji V5
**Rozwiązanie:**
```bash
# Restart backendu
restart.bat backend

# Test endpointu
curl http://localhost:5001/api/pallets/functions/check
```

### Problem: Formatki nie są poprawnie przypisywane
**Przyczyna:** Błąd w funkcji `pal_planuj_inteligentnie_v5`
**Rozwiązanie:**
```sql
-- Sprawdź strukturę pozycje_formatki
SELECT pf.*, p.kolor_plyty 
FROM zko.pozycje_formatki pf
JOIN zko.pozycje p ON pf.pozycja_id = p.id
WHERE p.zko_id = [ZKO_ID]
LIMIT 5;

-- Test funkcji manualnie
SELECT * FROM zko.pal_planuj_inteligentnie_v5(
  [ZKO_ID], 'inteligentna', 1440, 200, 700, 18, 'EURO', true, 'test', false
);
```

### Problem: Inteligentne usuwanie nie działa
**Diagnoza:**
```sql
-- Sprawdź statusy palet
SELECT numer_palety, status, ilosc_formatek, formatki_ids
FROM zko.palety 
WHERE zko_id = [ZKO_ID];
```

**Rozwiązanie:** Sprawdź czy palety nie mają statusu blokującego (`wyslana`, `dostarczona`)

### Problem: Strategia 'inteligentna' działa zbyt wolno
**Rozwiązanie:** Użyj strategii 'kolor' lub 'optymalizacja' dla dużych ZKO

### Problem: Reorganizacja tworzy za dużo palet
**Rozwiązanie:** Zwiększ `max_formatek_na_palete` lub zmień strategię na 'optymalizacja'

### Problem: Formatki się gubią podczas transferu
**Rozwiązanie:** Funkcja `pal_przesun_formatki` ma teraz pełne logowanie - sprawdź `zko.historia_statusow`

## 📈 Metryki i KPI V5

### Nowe wskaźniki do monitorowania
1. **Wykorzystanie palety V5** = (rzeczywista wysokość / max wysokość) * 100%
2. **Efektywność strategii** = (formatki na palecie / max formatki) * 100%
3. **Jednorodność kolorowa** = (główny kolor / wszystkie formatki) * 100%
4. **Wskaźnik reorganizacji** = liczba operacji przeniesienia / total formatki
5. **Czas realizacji** = czas od planowania do zamknięcia wszystkich palet

### Cele optymalizacji V5
- Wykorzystanie palety > 85%
- Jednorodność koloru > 95% (strategia 'kolor')
- Reorganizacje < 5% formatek
- Puste palety < 10% wszystkich palet
- Czas planowania < 30 sekund

## 🚨 Limity i ograniczenia V5

### Nowe limity systemowe
```typescript
const LIMITY_PALETY_V5 = {
  MAX_WYSOKOSC_MM: 1600,        // Zwiększono z 1500
  DOMYSLNA_WYSOKOSC_MM: 1440,
  OPTYMALNA_WYSOKOSC_MM: 1200,  // 🆕 Nowy limit optymalny
  
  MAX_FORMATEK: 500,
  DOMYSLNE_FORMATEK: 200,
  OPTYMALNE_FORMATEK_MIN: 150,  // 🆕 Zakres optymalny
  OPTYMALNE_FORMATEK_MAX: 250,
  
  MAX_WAGA_KG: 1000,
  DOMYSLNA_WAGA_KG: 700,
  OPTYMALNA_WAGA_KG: 600,       // 🆕 Optymalna waga
  
  MIN_WYKORZYSTANIE_PROCENT: 70, // 🆕 Minimalne wykorzystanie
  OPTYMALNE_WYKORZYSTANIE_PROCENT: 85
};
```

### Walidacje przed operacjami
- Sprawdzenie statusów palet przed usunięciem
- Walidacja limitów przed przenoszeniem formatek
- Kontrola wykorzystania przed dodaniem formatek
- Sprawdzenie kompatybilności kolorów (strategia 'kolor')

## 🔍 Diagnostyka problemów V5

### Sprawdzenie funkcji
```bash
# Test dostępności funkcji V5
curl http://localhost:5001/api/pallets/functions/check

# Oczekiwany wynik:
{
  "sukces": true,
  "dostepne_funkcje": [
    "pal_planuj_inteligentnie_v5",
    "pal_usun_inteligentnie", 
    "pal_reorganizuj_v5",
    "pal_wyczysc_puste_v2"
  ],
  "wersja": "V5",
  "status": "ready"
}
```

### Test planowania
```bash
# Test planowania dla ZKO
curl -X POST http://localhost:5001/api/pallets/zko/27/plan-v5 \
  -H "Content-Type: application/json" \
  -d '{
    "strategia": "inteligentna",
    "max_wysokosc_mm": 1440,
    "max_waga_kg": 700,
    "uwzglednij_oklejanie": true
  }'
```

### Analiza statystyk
```bash
# Pobierz szczegółowe statystyki
curl http://localhost:5001/api/pallets/stats/27
```

## 🎯 Komponenty V5

### PaletyManager.tsx ⭐ (GŁÓWNY)
**Nowe funkcje:**
- `handlePlanujPaletyV5()` - Planowanie z nowymi strategiami
- `handleUsunInteligentnie()` - Inteligentne usuwanie
- `handleReorganizuj()` - Reorganizacja palet
- Lepsze obsługi błędów i walidacje

### PlanowanieModal.tsx ⭐ (ULEPSZONE)
**Nowe funkcje:**
- Presets dla różnych typów produkcji
- Wizualne przedstawienie strategii
- Real-time podgląd ustawień
- Walidacja parametrów

### PaletyStats.tsx (ROZSZERZONE)
**Nowe metryki:**
- Procent wykorzystania palet
- Statystyki wagi
- Analiza kolorów na paletach
- Wskaźniki optymalizacji

## 🐛 Znane problemy i rozwiązania V5

### Problem: Funkcja V5 nie istnieje w bazie
**Rozwiązanie:** 
```sql
-- Wykonaj skrypty instalacyjne
\i database/functions/palety_v5.sql
\i database/functions/palety_management_v5.sql
```

### Problem: Strategia 'inteligentna' działa zbyt wolno
**Rozwiązanie:** Użyj strategii 'kolor' lub 'optymalizacja' dla dużych ZKO

### Problem: Reorganizacja tworzy za dużo palet
**Rozwiązanie:** Zwiększ `max_formatek_na_palete` lub zmień strategię na 'optymalizacja'

### Problem: Formatki się gubią podczas transferu
**Rozwiązanie:** Funkcja `pal_przesun_formatki` ma teraz pełne logowanie - sprawdź `zko.historia_statusow`

## 🔄 Migration z V4 do V5

### Co się zmieniło:
1. **Endpoint `/plan`** → `/plan-v5` (nowy algorytm)
2. **Strategia planowania** - więcej opcji
3. **Inteligentne usuwanie** - nowy endpoint `/delete-smart`
4. **Reorganizacja** - osobny endpoint `/reorganize`

### Jak migrować:
1. Zainstaluj funkcje V5 w bazie danych: `quick-install-palety-v5.bat`
2. Zastąp wywołania w komponencie React
3. Przetestuj nowe funkcjonalności
4. Opcjonalnie usuń stare endpointy V4

## 🚀 Przyszłe rozszerzenia V6

Planowane funkcjonalności:
- [ ] AI-powered planowanie z uczeniem maszynowym
- [ ] Wizualizacja 3D układu formatek na palecie
- [ ] Integracja z systemem WMS
- [ ] Automatyczne etykiety QR dla palet
- [ ] Predykcja uszkodzeń w transporcie
- [ ] Optymalizacja tras transportowych
- [ ] Dashboard analityczny czasu pracy palet
- [ ] Integracja z systemami ERP klientów

## 📚 Dokumentacja techniczna

### Pliki funkcji PostgreSQL:
- `/database/functions/palety_v5.sql` - Główne funkcje planowania
- `/database/functions/palety_management_v5.sql` - Zarządzanie i usuwanie
- `/database/views/palety_v5.sql` - Nowe widoki (TODO)

### Testy:
- `/tests/palety-v5/` - Testy jednostkowe funkcji V5
- `/scripts/testing/test-palety-v5.sh` - Testy API

### Przykłady integracji:
- `/docs/examples/palety-v5-integration.md` - Przykłady użycia w React
- `/docs/api/pallets-v5.md` - Dokumentacja API

---

## 📝 Changelog V5

### v5.0.1 (2025-08-30) - UPDATE
**Dodane:**
- ✅ Skrypty instalacyjne `quick-install-palety-v5.bat`
- ✅ Skrypt testowy `test-palety-v5.bat`
- ✅ Rozszerzona dokumentacja instalacji
- ✅ Troubleshooting dla częstych problemów

**Poprawione:**
- 🔧 Dokumentacja instalacji funkcji V5
- 🔧 Instrukcje migracji z V4 na V5

### v5.0.0 (2025-08-30)
**Dodane:**
- ✅ Funkcja `pal_planuj_inteligentnie_v5()` z 6 strategiami
- ✅ Funkcja `pal_usun_inteligentnie()` z auto-transferem
- ✅ Funkcja `pal_reorganizuj_v5()` z optymalizacją
- ✅ Presets dla różnych typów produkcji
- ✅ Endpoint `/plan-v5` z lepszą walidacją
- ✅ Endpoint `/delete-smart` z inteligentnym usuwaniem
- ✅ Endpoint `/reorganize` z optymalizacją układu
- ✅ Szczegółowe statystyki i metryki
- ✅ Ulepszone komunikaty błędów i logowanie

**Zmienione:**
- 🔄 PaletyManager.tsx - nowe funkcje i lepsze UX
- 🔄 PlanowanieModal.tsx - presets i wizualne strategie
- 🔄 Types.ts - nowe typy i interfejsy V5
- 🔄 API routing - dodano v5.routes.ts

**Deprecated:**
- ⚠️ `pal_planuj_inteligentnie_v4()` - zastąpiona przez V5
- ⚠️ Stare endpointy `/plan` - zalecane przejście na `/plan-v5`

**Następne:**
- 🎯 Instalacja funkcji V5 w bazie danych
- 🎯 Testy wszystkich nowych funkcjonalności
- 🎯 Migracja istniejących ZKO na nowy system
- 🎯 Dokumentacja dla użytkowników końcowych

---

## 🎯 TODO - Zadania do wykonania

### Pilne (dziś):
- [x] Zainstalować funkcje V5 w bazie PostgreSQL - **Użyj: `quick-install-palety-v5.bat`**
- [ ] Przetestować endpoint `/plan-v5`
- [ ] Przetestować inteligentne usuwanie
- [ ] Sprawdzić działanie presets

### Ważne (ten tydzień):
- [ ] Napisać testy jednostkowe dla V5
- [ ] Utworzyć dokumentację API V5
- [ ] Migracja przykładowego ZKO na V5
- [ ] Performance testing dla dużych ZKO

### Przyszłe:
- [ ] Usuń deprecated funkcje V4
- [ ] Dodaj wizualizację 3D
- [ ] Integracja z systemem etykiet

---

## 💡 Wskazówki dla deweloperów

1. **Zawsze używaj V5** - nie korzystaj z starych funkcji V4
2. **Testuj strategie** - każda strategia ma inne zastosowanie
3. **Monitoruj wykorzystanie** - cel to >85% wykorzystania palety
4. **Używaj presets** - oszczędzają czas i zapewniają optymalne ustawienia
5. **Loguj operacje** - wszystkie funkcje V5 mają wbudowane logowanie

---

**Autor:** marlowX  
**Email:** biuro@alpmeb.pl  
**Wersja:** 5.0.1  
**Data aktualizacji:** 2025-08-30