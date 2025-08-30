-- =====================================================
-- INSTRUKCJA INSTALACJI FUNKCJI PALETY V5
-- =====================================================
-- 
-- 1. Otwórz pgAdmin
-- 2. Połącz się z bazą 'alpsys'
-- 3. Kliknij prawym na bazie 'alpsys' -> Query Tool
-- 4. Wklej CAŁĄ zawartość tego pliku
-- 5. Kliknij Execute (F5)
-- 
-- Po instalacji sprawdź w pgAdmin:
-- Schemas -> zko -> Functions -> powinny być funkcje:
-- - pal_planuj_inteligentnie_v5
-- - pal_usun_inteligentnie
-- - pal_reorganizuj_v5
-- - pal_wyczysc_puste_v2
--
-- =====================================================

-- Informacja o instalacji
DO $$
BEGIN
    RAISE NOTICE 'Rozpoczynam instalację funkcji PaletyManager V5...';
END $$;

-- Tu wklej zawartość z pliku: database/functions/palety_v5.sql
-- Tu wklej zawartość z pliku: database/functions/palety_management_v5.sql

-- Test instalacji
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.routines 
    WHERE routine_schema = 'zko' 
    AND routine_name IN (
        'pal_planuj_inteligentnie_v5',
        'pal_usun_inteligentnie',
        'pal_reorganizuj_v5',
        'pal_wyczysc_puste_v2'
    );
    
    IF v_count = 4 THEN
        RAISE NOTICE 'SUKCES: Wszystkie 4 funkcje V5 zainstalowane!';
    ELSE
        RAISE WARNING 'UWAGA: Zainstalowano tylko % z 4 funkcji', v_count;
    END IF;
END $$;