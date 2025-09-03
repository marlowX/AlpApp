# 🚨 PILNE - WYMAGANA AKTUALIZACJA BAZY DANYCH

## Problem
Funkcja `zko.pobierz_nastepne_kroki_simple` nie obsługuje statusu `BUFOR_PILA` i innych niestandardowych statusów, przez co okno zmiany statusu ZKO nie pokazuje dostępnych kroków.

## Rozwiązanie
Administrator bazy danych musi wykonać skrypt SQL znajdujący się w:
```
AlpApp/sql/UPDATE_REQUIRED_fix_next_steps_function.sql
```

## Instrukcja dla Administratora

1. **Zaloguj się do bazy danych PostgreSQL** z uprawnieniami do modyfikacji funkcji
2. **Wykonaj skrypt SQL** z pliku `UPDATE_REQUIRED_fix_next_steps_function.sql`
3. **Zweryfikuj** działanie wykonując test:
   ```sql
   SELECT * FROM zko.pobierz_nastepne_kroki_simple(40);
   -- Powinno zwrócić: OKLEJANIE, BUFOR_OKLEINIARKA, MAGAZYN
   ```

## Tymczasowe rozwiązanie (do czasu aktualizacji bazy)

Jeśli nie możesz zaktualizować bazy danych, możesz ręcznie zmienić status ZKO używając funkcji `zmien_status_v3`:

```sql
-- Zmiana statusu ZKO-00040 z BUFOR_PILA na OKLEJANIE
SELECT * FROM zko.zmien_status_v3(
    40,                    -- ID ZKO
    'OKLEJANIE',          -- nowy status
    'admin',              -- użytkownik
    'Przejście z bufora piły',  -- komentarz
    'Jan Kowalski',       -- operator
    'Okleiniarka 1'       -- lokalizacja
);
```

## Lista obsługiwanych przejść statusów

### Obecnie działające:
- NOWE → CIECIE, BUFOR_CIECIE
- CIECIE → OKLEJANIE, BUFOR_OKLEINIARKA
- OKLEJANIE → WIERCENIE, BUFOR_WIERCENIE  
- WIERCENIE → PAKOWANIE
- PAKOWANIE → TRANSPORT, ZAKONCZONA

### Po aktualizacji będą działać dodatkowo:
- BUFOR_PILA → OKLEJANIE, BUFOR_OKLEINIARKA, MAGAZYN
- CIECIE_START → OKLEJANIE, BUFOR_OKLEINIARKA, MAGAZYN
- OKLEJANIE_START → WIERCENIE, BUFOR_WIERCENIE, MAGAZYN
- PAKOWANIE_STOP → TRANSPORT, WYSYLKA, MAGAZYN, ZAKONCZONA
- TRANSPORT_1 → ZAKONCZONA
- WYSYLKA → ZAKONCZONA

## Kontakt
W razie problemów skontaktuj się z działem IT lub administratorem bazy danych.

---
*Dokument utworzony: 2025-09-03*
