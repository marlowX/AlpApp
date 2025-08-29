-- Funkcja usuwania pozycji ZKO
-- Autor: System ZKO
-- Data: 2025-08-29
-- Opis: Bezpieczne usuwanie pozycji z walidacją statusu i kaskadowym usuwaniem powiązań

CREATE OR REPLACE FUNCTION zko.usun_pozycje_zko(
    p_pozycja_id INTEGER,
    p_uzytkownik VARCHAR DEFAULT 'system',
    p_powod TEXT DEFAULT NULL
)
RETURNS TABLE (
    sukces BOOLEAN,
    komunikat TEXT,
    usuniete_formatki INTEGER,
    usuniete_palety INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_zko_id INTEGER;
    v_status VARCHAR;
    v_formatki_count INTEGER;
    v_palety_count INTEGER;
    v_status_pozycji VARCHAR;
    v_numer_zko VARCHAR;
BEGIN
    -- Sprawdź czy pozycja istnieje
    SELECT p.zko_id, z.status, p.status, z.numer_zko 
    INTO v_zko_id, v_status, v_status_pozycji, v_numer_zko
    FROM zko.pozycje p
    JOIN zko.zlecenia z ON z.id = p.zko_id
    WHERE p.id = p_pozycja_id;
    
    IF v_zko_id IS NULL THEN
        RETURN QUERY SELECT 
            false,
            'Pozycja o ID ' || p_pozycja_id || ' nie istnieje',
            0::INTEGER,
            0::INTEGER;
        RETURN;
    END IF;
    
    -- Sprawdź czy pozycja może być usunięta (tylko status 'oczekuje')
    IF v_status_pozycji != 'oczekuje' THEN
        RETURN QUERY SELECT 
            false,
            'Nie można usunąć pozycji w statusie: ' || v_status_pozycji || '. Tylko pozycje "oczekuje" mogą być usuwane.',
            0::INTEGER,
            0::INTEGER;
        RETURN;
    END IF;
    
    -- Sprawdź czy ZKO nie jest zakończone
    IF v_status IN ('ZAKONCZONY', 'ANULOWANY') THEN
        RETURN QUERY SELECT 
            false,
            'Nie można usunąć pozycji ze zlecenia ' || v_numer_zko || ' w statusie: ' || v_status,
            0::INTEGER,
            0::INTEGER;
        RETURN;
    END IF;
    
    -- Policz formatki do usunięcia
    SELECT COUNT(*) INTO v_formatki_count
    FROM zko.pozycje_formatki
    WHERE pozycja_id = p_pozycja_id;
    
    -- Policz palety powiązane z pozycją
    SELECT COUNT(DISTINCT paleta_id) INTO v_palety_count
    FROM zko.pozycje_formatki
    WHERE pozycja_id = p_pozycja_id AND paleta_id IS NOT NULL;
    
    -- Rozpocznij transakcję
    BEGIN
        -- Zapisz do historii
        INSERT INTO zko.historia_statusow (
            zko_id, 
            status, 
            uzytkownik, 
            komentarz,
            data_zmiany
        ) VALUES (
            v_zko_id,
            v_status,
            p_uzytkownik,
            'Usunięto pozycję #' || p_pozycja_id || 
            CASE WHEN p_powod IS NOT NULL THEN ' - Powód: ' || p_powod ELSE '' END ||
            ' (formatek: ' || v_formatki_count || ', palet: ' || v_palety_count || ')',
            NOW()
        );
        
        -- Usuń formatki (kaskadowo usuwa powiązania)
        DELETE FROM zko.pozycje_formatki WHERE pozycja_id = p_pozycja_id;
        
        -- Usuń puste palety jeśli istnieją
        DELETE FROM zko.palety 
        WHERE zko_id = v_zko_id 
        AND NOT EXISTS (
            SELECT 1 FROM zko.pozycje_formatki pf 
            WHERE pf.paleta_id = palety.id
        );
        
        -- Usuń pozycję
        DELETE FROM zko.pozycje WHERE id = p_pozycja_id;
        
        -- Zwróć sukces
        RETURN QUERY SELECT 
            true,
            'Pozycja #' || p_pozycja_id || ' została usunięta z ZKO ' || v_numer_zko || 
            '. Usunięto ' || v_formatki_count || ' formatek i ' || v_palety_count || ' palet.',
            v_formatki_count,
            v_palety_count;
            
    EXCEPTION
        WHEN foreign_key_violation THEN
            RETURN QUERY SELECT 
                false,
                'Nie można usunąć pozycji - istnieją powiązane rekordy które blokują usunięcie',
                0::INTEGER,
                0::INTEGER;
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                false,
                'Błąd podczas usuwania pozycji: ' || SQLERRM,
                0::INTEGER,
                0::INTEGER;
    END;
END;
$$;

-- Przyznaj uprawnienia do wykonywania funkcji
GRANT EXECUTE ON FUNCTION zko.usun_pozycje_zko TO alpsys_user;

-- Komentarz do funkcji
COMMENT ON FUNCTION zko.usun_pozycje_zko IS 'Bezpieczne usuwanie pozycji ZKO z walidacją statusu i kaskadowym usuwaniem formatek/palet';

-- Przykład użycia:
-- SELECT * FROM zko.usun_pozycje_zko(41, 'admin', 'Błędnie dodana pozycja');

-- Test walidacji:
-- SELECT * FROM zko.usun_pozycje_zko(999, 'admin'); -- Zwróci błąd: pozycja nie istnieje
-- SELECT * FROM zko.usun_pozycje_zko(41, 'admin'); -- Usunie jeśli status = 'oczekuje'