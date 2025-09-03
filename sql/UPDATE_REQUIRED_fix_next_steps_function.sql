-- =====================================================
-- AKTUALIZACJA FUNKCJI pobierz_nastepne_kroki_simple
-- Data: 2025-09-03
-- Problem: Funkcja nie obsługiwała statusu BUFOR_PILA i innych
-- =====================================================

-- INSTRUKCJA DLA ADMINISTRATORA BAZY DANYCH:
-- 1. Zaloguj się do bazy danych PostgreSQL jako użytkownik z uprawnieniami do modyfikacji funkcji
-- 2. Wykonaj poniższy kod SQL
-- 3. Sprawdź czy funkcja działa poprawnie używając testów na końcu pliku

-- DROP starej wersji funkcji (jeśli istnieje)
DROP FUNCTION IF EXISTS zko.pobierz_nastepne_kroki_simple(integer);

-- UTWORZENIE nowej wersji funkcji
CREATE OR REPLACE FUNCTION zko.pobierz_nastepne_kroki_simple(p_zko_id integer)
 RETURNS TABLE(kod_etapu character varying, nazwa_etapu character varying)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_status VARCHAR;
BEGIN
    -- Pobierz aktualny status (normalizuj do uppercase)
    SELECT UPPER(status) INTO v_status
    FROM zko.zlecenia
    WHERE id = p_zko_id;
    
    -- Log dla debugowania
    RAISE NOTICE 'Status ZKO %: %', p_zko_id, v_status;
    
    -- Zwróć następne możliwe kroki w zależności od statusu
    IF v_status = 'NOWE' THEN
        RETURN QUERY
        SELECT 'CIECIE'::VARCHAR, 'Rozpocznij cięcie'::VARCHAR
        UNION ALL
        SELECT 'BUFOR_PILA'::VARCHAR, 'Przekaż do bufora piły'::VARCHAR;
        
    -- Obsługa statusów CIECIE i bufora piły
    ELSIF v_status IN ('CIECIE', 'CIECIE_START', 'BUFOR_PILA', 'CIECIE_STOP') THEN
        RETURN QUERY
        SELECT 'OKLEJANIE'::VARCHAR, 'Rozpocznij oklejanie'::VARCHAR
        UNION ALL
        SELECT 'BUFOR_OKLEINIARKA'::VARCHAR, 'Przekaż do bufora okleiniarki'::VARCHAR
        UNION ALL
        SELECT 'MAGAZYN'::VARCHAR, 'Przekaż na magazyn'::VARCHAR;
        
    -- Obsługa statusów OKLEJANIE i bufora okleiniarki  
    ELSIF v_status IN ('OKLEJANIE', 'OKLEJANIE_START', 'BUFOR_OKLEINIARKA', 'OKLEJANIE_STOP') THEN
        RETURN QUERY
        SELECT 'WIERCENIE'::VARCHAR, 'Rozpocznij wiercenie'::VARCHAR
        UNION ALL
        SELECT 'BUFOR_WIERCENIE'::VARCHAR, 'Przekaż do bufora wiertarki'::VARCHAR
        UNION ALL
        SELECT 'MAGAZYN'::VARCHAR, 'Przekaż na magazyn'::VARCHAR;
        
    -- Obsługa statusów WIERCENIE i bufora wiertarki
    ELSIF v_status IN ('WIERCENIE', 'WIERCENIE_START', 'BUFOR_WIERCENIE', 'WIERCENIE_STOP') THEN
        RETURN QUERY
        SELECT 'PAKOWANIE'::VARCHAR, 'Rozpocznij pakowanie'::VARCHAR
        UNION ALL
        SELECT 'MAGAZYN'::VARCHAR, 'Przekaż na magazyn'::VARCHAR;
        
    -- Obsługa statusów PAKOWANIE
    ELSIF v_status IN ('PAKOWANIE', 'PAKOWANIE_START', 'PAKOWANIE_STOP', 'ZAMKNIECIE_PALETY') THEN
        RETURN QUERY
        SELECT 'TRANSPORT'::VARCHAR, 'Przygotuj do transportu'::VARCHAR
        UNION ALL
        SELECT 'WYSYLKA'::VARCHAR, 'Wyślij do klienta'::VARCHAR
        UNION ALL
        SELECT 'MAGAZYN'::VARCHAR, 'Przekaż na magazyn'::VARCHAR
        UNION ALL
        SELECT 'ZAKONCZONA'::VARCHAR, 'Zakończ zlecenie'::VARCHAR;
        
    -- Obsługa statusów TRANSPORT i WYSYŁKA
    ELSIF v_status IN ('TRANSPORT', 'TRANSPORT_1', 'WYSYLKA') THEN
        RETURN QUERY
        SELECT 'ZAKONCZONA'::VARCHAR, 'Potwierdź odbiór i zakończ'::VARCHAR;
        
    -- Obsługa MAGAZYN
    ELSIF v_status = 'MAGAZYN' THEN
        RETURN QUERY
        SELECT 'WYSYLKA'::VARCHAR, 'Wyślij z magazynu'::VARCHAR
        UNION ALL
        SELECT 'ZAKONCZONA'::VARCHAR, 'Zakończ zlecenie'::VARCHAR;
        
    -- Status ZAKONCZONA lub ZAKONCZONE - brak dalszych kroków
    ELSIF v_status IN ('ZAKONCZONA', 'ZAKONCZONE') THEN
        -- Brak dalszych kroków - zwracamy pustą tabelę
        RETURN;
        
    -- Nieznany status - pokaż podstawowe opcje
    ELSE
        RAISE NOTICE 'Nieznany status: %. Zwracam domyślne opcje.', v_status;
        RETURN QUERY
        SELECT 'MAGAZYN'::VARCHAR, 'Przekaż na magazyn'::VARCHAR
        UNION ALL
        SELECT 'ZAKONCZONA'::VARCHAR, 'Zakończ zlecenie'::VARCHAR;
    END IF;
END;
$function$;

-- Nadaj uprawnienia
GRANT EXECUTE ON FUNCTION zko.pobierz_nastepne_kroki_simple(integer) TO PUBLIC;

-- =====================================================
-- TESTY FUNKCJI
-- =====================================================

-- Test 1: Sprawdź działanie dla ZKO-00040 (status BUFOR_PILA)
SELECT '=== TEST 1: ZKO-00040 (BUFOR_PILA) ===' AS test;
SELECT * FROM zko.pobierz_nastepne_kroki_simple(
    (SELECT id FROM zko.zlecenia WHERE numer_zko = 'ZKO-00040')
);

-- Test 2: Sprawdź dla statusu NOWE
SELECT '=== TEST 2: Status NOWE ===' AS test;
SELECT * FROM zko.pobierz_nastepne_kroki_simple(
    (SELECT id FROM zko.zlecenia WHERE status = 'NOWE' LIMIT 1)
);

-- Test 3: Sprawdź dla statusu TRANSPORT_1
SELECT '=== TEST 3: Status TRANSPORT_1 ===' AS test;
SELECT * FROM zko.pobierz_nastepne_kroki_simple(
    (SELECT id FROM zko.zlecenia WHERE status = 'TRANSPORT_1' LIMIT 1)
);

-- Test 4: Pokaż wszystkie unikalne statusy w systemie
SELECT '=== TEST 4: Wszystkie statusy w systemie ===' AS test;
SELECT DISTINCT status, COUNT(*) as liczba_zko
FROM zko.zlecenia
GROUP BY status
ORDER BY status;

-- =====================================================
-- INFORMACJE DLA ADMINISTRATORA
-- =====================================================
-- Funkcja obsługuje teraz następujące statusy:
-- - NOWE -> CIECIE, BUFOR_PILA
-- - CIECIE/CIECIE_START/BUFOR_PILA -> OKLEJANIE, BUFOR_OKLEINIARKA, MAGAZYN
-- - OKLEJANIE/OKLEJANIE_START/BUFOR_OKLEINIARKA -> WIERCENIE, BUFOR_WIERCENIE, MAGAZYN
-- - WIERCENIE/WIERCENIE_START/BUFOR_WIERCENIE -> PAKOWANIE, MAGAZYN
-- - PAKOWANIE/PAKOWANIE_START/PAKOWANIE_STOP -> TRANSPORT, WYSYLKA, MAGAZYN, ZAKONCZONA
-- - TRANSPORT/TRANSPORT_1/WYSYLKA -> ZAKONCZONA
-- - MAGAZYN -> WYSYLKA, ZAKONCZONA
-- - ZAKONCZONA/ZAKONCZONE -> brak dalszych kroków

-- W przypadku problemów sprawdź logi PostgreSQL - funkcja używa RAISE NOTICE do debugowania
