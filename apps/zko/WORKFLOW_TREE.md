# 🏭 KOMPLETNE DRZEWO WORKFLOW ZKO - System Produkcji

## 📋 OBSZARY WORKFLOW

### 🟦 1. OBSZAR PLANOWANIA (Biuro/Zarządzanie)
**Uprawnienia:** Administrator, Planista, Kierownik produkcji  
**Miejsce:** Panel zarządzania ZKO

### 🟩 2. OBSZAR PRODUKCJI (Hala produkcyjna)
**Uprawnienia:** Operatorzy maszyn  
**Miejsce:** Panele pracowników (Worker Views)

---

## 🌳 PEŁNE DRZEWO WORKFLOW

```
📌 START
│
├─📋 [1] UTWORZENIE ZKO
│   ├─ Funkcja: zko.utworz_puste_zko()
│   ├─ Status: NOWE
│   ├─ Panel: /zko/create
│   └─ Wymagane: kooperant, priorytet
│
├─📝 [2] DODANIE POZYCJI
│   ├─ Funkcja: zko.dodaj_pozycje_do_zko()
│   ├─ Status: NOWE
│   ├─ Panel: /zko/:id (szczegóły)
│   ├─ Wymagane: rozkroj_id, kolory_plyty[{kolor, nazwa, ilosc}]
│   └─ ⚠️ LIMIT: 4 płyty standard, max 5 płyt (PIŁA MASTERWOOD)
│
├─📦 [3] PLANOWANIE PALET
│   ├─ Funkcja: zko.pal_planuj_inteligentnie_v3()
│   ├─ Status: NOWE
│   ├─ Panel: /zko/:id (PaletyManager)
│   └─ Automatyczny rozkład formatek na palety
│
├─🚀 [4] START PRODUKCJI ──────────────┐
│   ├─ Funkcja: zko.zmien_status_v3()  │
│   ├─ Status: NOWE → CIECIE_START     │ 🔴 OBSZAR PRODUKCJI
│   ├─ Panel: /worker/pila             │
│   └─ Tworzy jednostkę tracking       ▼
│
├─✂️ STANOWISKO PIŁY (/worker/pila)
│   │
│   ├─[4] CIECIE_START 
│   │   ├─ Rozpoczęcie cięcia płyt
│   │   ├─ 🆘 [4.1] ZGŁOSZENIE USZKODZEŃ (opcjonalne)
│   │   │   ├─ Funkcja: tracking.zglos_uszkodzenie_uniwersalne()
│   │   │   ├─ Rejestracja uszkodzonych formatek
│   │   │   └─ Status pozostaje: CIECIE_START
│   │   │
│   │   ├─ 📊 [4.3] RAPORT PRODUKCJI (opcjonalne)
│   │   │   └─ Funkcja: zko.raportuj_produkcje_formatek()
│   │   │
│   │   └─➡️ Przejście do: OTWARCIE_PALETY
│   │
│   ├─[5] OTWARCIE_PALETY
│   │   ├─ Otwarcie nowej palety do pakowania
│   │   └─➡️ Przejście do: PAKOWANIE_PALETY
│   │
│   ├─[6] PAKOWANIE_PALETY
│   │   ├─ Układanie formatek na palecie
│   │   └─➡️ Przejście do: ZAMKNIECIE_PALETY
│   │
│   ├─[7] ZAMKNIECIE_PALETY
│   │   ├─ Funkcja: zko.pal_zamknij()
│   │   ├─ Obliczenie parametrów palety
│   │   ├─ 🔄 [7.1] Jeśli więcej formatek → powrót do [5]
│   │   └─➡️ Jeśli koniec → CIECIE_STOP
│   │
│   ├─[8] CIECIE_STOP
│   │   ├─ Zakończenie procesu cięcia
│   │   └─➡️ Przejście do: BUFOR_PILA
│   │
│   └─[9] BUFOR_PILA 🏭
│       ├─ Palety czekają na transport
│       └─➡️ Akcja: "🚚 Wyślij do okleiniarki" → TRANSPORT_1
│
├─🚚 TRANSPORT_1 (automatyczny lub ręczny)
│   ├─ Funkcja: tracking.rozpocznij_transport_uniwersalny()
│   ├─ Transport palet z piły
│   └─➡️ Cel zależny od typu formatek:
│       ├─ Formatki oklejane → BUFOR_OKLEINIARKA
│       ├─ Formatki tylko wiercone → BUFOR_WIERTARKA
│       └─ Formatki gotowe → MAGAZYN
│
├─🎨 STANOWISKO OKLEINIARKI (/worker/okleiniarka)
│   │
│   ├─[10] BUFOR_OKLEINIARKA 🏭
│   │   ├─ Funkcja: zko.przyjmij_na_bufor_okleiniarka()
│   │   ├─ Palety w buforze przed okleiniarką
│   │   ├─ 📊 Funkcja: zko.stan_bufora_okleiniarka()
│   │   └─➡️ Akcja: "🎨 Rozpocznij oklejanie" → OKLEJANIE_START
│   │
│   ├─[10.1] OKLEJANIE_START
│   │   ├─ Proces oklejania krawędzi
│   │   ├─ 🆘 Możliwość zgłoszenia uszkodzeń
│   │   └─➡️ Przejście do: OKLEJANIE_STOP
│   │
│   └─[10.2] OKLEJANIE_STOP
│       ├─ Zakończenie oklejania
│       └─➡️ Akcja: "🚚 Wyślij do wiertarki" → TRANSPORT_2
│
├─🚚 TRANSPORT_2
│   ├─ Transport z okleiniarki
│   └─➡️ Cel: BUFOR_WIERTARKA lub MAGAZYN
│
├─🔧 STANOWISKO WIERTARKI (/worker/wiertarka)
│   │
│   ├─[11] BUFOR_WIERTARKA 🏭
│   │   ├─ Palety w buforze przed wiertarką
│   │   └─➡️ Akcja: "🔧 Rozpocznij wiercenie" → WIERCENIE_START
│   │
│   ├─[11.1] WIERCENIE_START
│   │   ├─ Proces wiercenia otworów
│   │   ├─ 🆘 Możliwość zgłoszenia uszkodzeń
│   │   └─➡️ Przejście do: WIERCENIE_STOP
│   │
│   └─[11.2] WIERCENIE_STOP
│       ├─ Zakończenie wiercenia
│       └─➡️ Akcja: "🚚 Wyślij do magazynu" → TRANSPORT_3
│
├─🚚 TRANSPORT_3
│   ├─ Transport z wiertarki
│   └─➡️ Cel: BUFOR_KOMPLETOWANIE lub MAGAZYN
│
├─📋 STANOWISKO KOMPLETOWANIA (/worker/kompletowanie) [TODO]
│   │
│   ├─[12] BUFOR_KOMPLETOWANIE 🏭
│   │   └─➡️ KOMPLETOWANIE_START
│   │
│   ├─[12.1] KOMPLETOWANIE_START
│   │   ├─ Zbieranie wszystkich elementów zamówienia
│   │   └─➡️ KOMPLETOWANIE_STOP
│   │
│   └─[12.2] KOMPLETOWANIE_STOP
│       └─➡️ BUFOR_PAKOWANIE
│
├─📦 STANOWISKO PAKOWANIA (/worker/pakowanie) [TODO]
│   │
│   ├─[13] BUFOR_PAKOWANIE 🏭
│   │   └─➡️ PAKOWANIE_START
│   │
│   ├─[13.1] PAKOWANIE_START
│   │   ├─ Pakowanie finalne do wysyłki
│   │   └─➡️ PAKOWANIE_STOP
│   │
│   └─[13.2] PAKOWANIE_STOP
│       └─➡️ BUFOR_WYSYLKA
│
├─🚛 [14] WYSYŁKA
│   ├─ BUFOR_WYSYLKA → WYSYLKA
│   └─ Przekazanie do transportu zewnętrznego
│
├─✅ [15] ZAKOŃCZENIE
│   ├─ Funkcja: zko.zakoncz_zlecenie()
│   ├─ Status: ZAKONCZONE
│   └─ Podsumowanie produkcji
│
└─❌ [99] ANULOWANIE (dostępne z każdego etapu)
    ├─ Funkcja: zko.usun_zko() lub UPDATE status=ANULOWANE
    └─ Wymagane: powód anulowania
```

---

## 🎯 KOMPETENCJE I UPRAWNIENIA

### 👔 PLANISTA/KIEROWNIK (Panel Zarządzania)
- ✅ Tworzenie nowych ZKO
- ✅ Dodawanie pozycji i rozkrojów
- ✅ Planowanie palet
- ✅ Zmiana dowolnego statusu (ręcznie)
- ✅ Edycja danych ZKO
- ✅ Anulowanie zlecenia
- ✅ Podgląd wszystkich ZKO

### 🔪 OPERATOR PIŁY (/worker/pila)
- ✅ Widzi: NOWE, CIECIE_START, OTWARCIE_PALETY, PAKOWANIE_PALETY, ZAMKNIECIE_PALETY, CIECIE_STOP, BUFOR_PILA
- ✅ Rozpoczęcie cięcia (NOWE → CIECIE_START)
- ✅ Zarządzanie paletami (otwarcie/pakowanie/zamknięcie)
- ✅ Zgłaszanie uszkodzeń podczas cięcia
- ✅ Transport do okleiniarki (BUFOR_PILA → TRANSPORT_1)

### 🎨 OPERATOR OKLEINIARKI (/worker/okleiniarka)
- ✅ Widzi: TRANSPORT_1, BUFOR_OKLEINIARKA, OKLEJANIE_START, OKLEJANIE_STOP
- ✅ Przyjęcie z transportu (TRANSPORT_1 → BUFOR_OKLEINIARKA)
- ✅ Rozpoczęcie/zakończenie oklejania
- ✅ Zgłaszanie uszkodzeń podczas oklejania
- ✅ Transport do wiertarki (OKLEJANIE_STOP → TRANSPORT_2)

### 🔧 OPERATOR WIERTARKI (/worker/wiertarka)
- ✅ Widzi: TRANSPORT_2, BUFOR_WIERTARKA, WIERCENIE_START, WIERCENIE_STOP
- ✅ Przyjęcie z transportu (TRANSPORT_2 → BUFOR_WIERTARKA)
- ✅ Rozpoczęcie/zakończenie wiercenia
- ✅ Zgłaszanie uszkodzeń podczas wiercenia
- ✅ Transport do magazynu (WIERCENIE_STOP → TRANSPORT_3)

### 📦 MAGAZYNIER (/worker/magazyn) [TODO]
- ✅ Widzi: TRANSPORT_3, BUFOR_KOMPLETOWANIE, wszystkie zakończone
- ✅ Przyjęcie gotowych elementów
- ✅ Kompletowanie zamówień
- ✅ Przygotowanie do wysyłki

---

## 🔄 WARIANTY PRZEPŁYWU

### WARIANT A: Pełna produkcja (cięcie + oklejanie + wiercenie)
```
NOWE → CIECIE → OKLEJANIE → WIERCENIE → MAGAZYN → WYSYŁKA
```

### WARIANT B: Tylko cięcie i oklejanie
```
NOWE → CIECIE → OKLEJANIE → MAGAZYN → WYSYŁKA
```

### WARIANT C: Tylko cięcie i wiercenie (bez oklejania)
```
NOWE → CIECIE → TRANSPORT_1 → WIERCENIE → MAGAZYN → WYSYŁKA
```

### WARIANT D: Tylko cięcie
```
NOWE → CIECIE → MAGAZYN → WYSYŁKA
```

---

## 📊 FUNKCJE POMOCNICZE

### Raportowanie i statystyki:
- `zko.pokaz_status_zko()` - Pełny status zlecenia
- `zko.raportuj_produkcje_formatek()` - Raport produkcji
- `zko.stan_bufora_okleiniarka()` - Stan bufora okleiniarki

### Zgłaszanie problemów:
- `tracking.zglos_uszkodzenie_uniwersalne()` - Uniwersalne zgłoszenie uszkodzeń
- `zko.zglos_uszkodzenie_formatki()` - Uszkodzenie konkretnych formatek

### Pobieranie informacji:
- `zko.pobierz_nastepne_etapy()` - Możliwe przejścia statusów
- `zko.waliduj_zmiane_statusu()` - Walidacja przed zmianą

---

## 🚦 STATUSY W SYSTEMIE

### ✅ ZAIMPLEMENTOWANE W PANELACH:
- ✅ NOWE
- ✅ CIECIE_START
- ✅ OTWARCIE_PALETY
- ✅ PAKOWANIE_PALETY
- ✅ ZAMKNIECIE_PALETY
- ✅ CIECIE_STOP
- ✅ BUFOR_PILA
- ✅ TRANSPORT_1
- ✅ BUFOR_OKLEINIARKA
- ✅ OKLEJANIE_START
- ✅ OKLEJANIE_STOP
- ✅ TRANSPORT_2
- ✅ BUFOR_WIERTARKA
- ✅ WIERCENIE_START
- ✅ WIERCENIE_STOP

### 🔜 DO IMPLEMENTACJI:
- ⏳ TRANSPORT_3
- ⏳ BUFOR_KOMPLETOWANIE
- ⏳ KOMPLETOWANIE_START
- ⏳ KOMPLETOWANIE_STOP
- ⏳ BUFOR_PAKOWANIE
- ⏳ PAKOWANIE_START
- ⏳ PAKOWANIE_STOP
- ⏳ BUFOR_WYSYLKA
- ⏳ WYSYLKA
- ⏳ ZAKONCZONE
- ⏳ ANULOWANE

---

## 🎯 KLUCZOWE ZASADY

1. **Każda zmiana statusu** jest rejestrowana w `zko.historia_statusow`
2. **Tracking jednostek** - automatyczne tworzenie przy CIECIE_START
3. **Bufory** - opcjonalne, można przeskoczyć jeśli stanowisko gotowe
4. **Uszkodzenia** - można zgłaszać na każdym etapie produkcji
5. **Transport** - może być automatyczny lub ręczny
6. **Walidacja** - system sprawdza czy zmiana statusu jest dozwolona
7. **WebSocket** - real-time aktualizacje w panelach

---

## 📱 ADRESY PANELI

### Zarządzanie:
- `/zko/modern-list` - Nowoczesna lista ZKO
- `/zko/create` - Tworzenie nowego ZKO
- `/zko/:id` - Szczegóły i edycja ZKO

### Panele produkcyjne:
- `/worker/pila` - Panel operatora piły
- `/worker/okleiniarka` - Panel operatora okleiniarki
- `/worker/wiertarka` - Panel operatora wiertarki
- `/worker/magazyn` - Panel magazynu [TODO]
- `/worker/kompletowanie` - Panel kompletowania [TODO]