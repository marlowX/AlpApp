-- DIAGNOZA I NAPRAWA BŁĘDÓW V5
-- Wykonaj ten skrypt krok po kroku w pgAdmin

-- 1. Sprawdź czy tabela palety ma wszystkie kolumny
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'zko' 
AND table_name = 'palety'
ORDER BY ordinal_position;

-- 2. Sprawdź strukturę tabeli pozycje_formatki
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'zko'
AND table_name = 'pozycje_formatki'
ORDER BY ordinal_position;

-- 3. Test prostego wywołania funkcji
SELECT * FROM zko.pal_planuj_inteligentnie_v5(
    27,  -- twoje ZKO ID
    'inteligentna',
    1440,
    200,
    700,
    18,
    'EURO',
    false,
    'test',
    false
);

-- Jeśli powyższe nie działa, sprawdź dokładny błąd