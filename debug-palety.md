# Debug problemu z zapisywaniem palet

## Problem
Ze screenshotu widać błąd z zapisywaniem palety w komponencie PaletyManager

## Zdiagnozowane problemy:
1. ✅ **NAPRAWIONE**: W ManualPalletCreator.tsx linia 126 używała hardkodowanego `http://localhost:5001` zamiast relatywnej ścieżki `/api`
2. ✅ **SPRAWDZONE**: Funkcja PostgreSQL `zko.pal_utworz_reczna_palete_v2` działa poprawnie - test udany
3. ✅ **SPRAWDZONE**: Backend endpoint `/api/pallets/manual/batch` istnieje i jest poprawnie skonfigurowany

## Zastosowane poprawki:

### 1. ManualPalletCreator.tsx
- Zmieniono URL z `http://localhost:5001/api/pallets/manual/batch` na `/api/pallets/manual/batch`
- Dodano lepsze logowanie błędów
- Poprawiono walidację danych (konwersja na Number)
- Dodano lepsze komunikaty dla użytkownika

### 2. Zwiększone debugowanie
- Dodano console.log dla request/response
- Poprawiono obsługę błędów API

## Test funkcji PostgreSQL:
```sql
SELECT * FROM zko.pal_utworz_reczna_palete_v2(
  68,  -- pozycja_id
  '[{"formatka_id": 288, "ilosc": 5}]'::jsonb,
  'MAGAZYN', 700, 1440, 'test_user', 'Test palety z MCP'
);
-- Rezultat: SUKCES - utworzono paletę PAL-ZKO-00028-0005
```

## Następne kroki:
1. Przetestować zapisywanie palety w UI
2. Sprawdzić logi w Network tab DevTools
3. Jeśli nadal problemy - sprawdzić proxy/routing w aplikacji React
