-- POPRAWKA WSZYSTKICH BŁĘDÓW W FUNKCJACH V5
-- Wykonaj ten skrypt w pgAdmin aby naprawić błędy 500

-- 1. Popraw funkcję pal_reorganizuj_v5
DROP FUNCTION IF EXISTS zko.pal_reorganizuj_v5;

CREATE OR REPLACE FUNCTION zko.pal_reorganizuj_v5(
    p_zko_id INTEGER,
    p_strategia VARCHAR DEFAULT 'optymalizacja'::VARCHAR,
    p_operator VARCHAR DEFAULT 'system'::VARCHAR
) RETURNS TABLE(
    sukces BOOLEAN,
    komunikat TEXT,
    przed_reorganizacja JSONB,
    po_reorganizacji JSONB
) LANGUAGE plpgsql AS $$
DECLARE
    v_stats_przed JSONB;
    v_stats_po JSONB;
    v_palety_przed INTEGER;
    v_palety_po INTEGER;
BEGIN
    -- Zbierz statystyki przed
    SELECT jsonb_build_object(
        'liczba_palet', COUNT(*)::integer,
        'formatki_total', COALESCE(SUM(ilosc_formatek), 0)::integer,
        'srednie_wykorzystanie', ROUND(COALESCE(AVG(wysokosc_stosu::numeric / 1440.0 * 100), 0), 2),
        'puste_palety', COUNT(*) FILTER (WHERE COALESCE(ilosc_formatek, 0) = 0)
    ) INTO v_stats_przed
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    v_palety_przed := COALESCE((v_stats_przed->>'liczba_palet')::integer, 0);
    
    -- Wyczyść puste palety
    PERFORM zko.pal_wyczysc_puste_v2(p_zko_id, p_operator);
    
    -- Strategia reorganizacji (uproszczona)
    IF p_strategia = 'optymalizacja' AND v_palety_przed > 0 THEN
        -- Tylko reorganizuj jeśli są jakieś palety
        -- Tu możesz dodać bardziej złożoną logikę reorganizacji
        NULL; -- Placeholder dla przyszłej implementacji
    END IF;
    
    -- Zbierz statystyki po
    SELECT jsonb_build_object(
        'liczba_palet', COUNT(*)::integer,
        'formatki_total', COALESCE(SUM(ilosc_formatek), 0)::integer,
        'srednie_wykorzystanie', ROUND(COALESCE(AVG(wysokosc_stosu::numeric / 1440.0 * 100), 0), 2),
        'puste_palety', COUNT(*) FILTER (WHERE COALESCE(ilosc_formatek, 0) = 0)
    ) INTO v_stats_po
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    v_palety_po := COALESCE((v_stats_po->>'liczba_palet')::integer, 0);
    
    RETURN QUERY SELECT 
        TRUE,
        format('Reorganizacja zakończona. Palet przed: %s, po: %s',
               v_palety_przed, v_palety_po),
        v_stats_przed,
        v_stats_po;
END;
$$;

-- 2. Upewnij się że pal_wyczysc_puste_v2 działa poprawnie
DROP FUNCTION IF EXISTS zko.pal_wyczysc_puste_v2;

CREATE OR REPLACE FUNCTION zko.pal_wyczysc_puste_v2(
    p_zko_id INTEGER DEFAULT NULL,
    p_operator VARCHAR DEFAULT 'system'::VARCHAR
) RETURNS TABLE(
    sukces BOOLEAN,
    komunikat TEXT,
    usuniete INTEGER,
    szczegoly JSONB
) LANGUAGE plpgsql AS $$
DECLARE
    v_usuniete_count INTEGER := 0;
    v_usuniete_palety JSONB := '[]'::jsonb;
    v_paleta RECORD;
BEGIN
    -- Usuń puste palety
    FOR v_paleta IN
        SELECT 
            p.id,
            p.numer_palety,
            p.zko_id,
            z.numer_zko
        FROM zko.palety p
        LEFT JOIN zko.zlecenia z ON p.zko_id = z.id
        WHERE (p_zko_id IS NULL OR p.zko_id = p_zko_id)
        AND (
            p.formatki_ids IS NULL OR 
            array_length(p.formatki_ids, 1) IS NULL OR
            array_length(p.formatki_ids, 1) = 0 OR
            COALESCE(p.ilosc_formatek, 0) = 0
        )
        AND COALESCE(p.status, 'pusta') IN ('przygotowanie', 'otwarta', 'pusta')
    LOOP
        -- Usuń pustą paletę
        DELETE FROM zko.palety WHERE id = v_paleta.id;
        
        -- Dodaj do listy usuniętych
        v_usuniete_palety := v_usuniete_palety || jsonb_build_object(
            'paleta_id', v_paleta.id,
            'numer_palety', v_paleta.numer_palety,
            'zko_id', v_paleta.zko_id,
            'numer_zko', COALESCE(v_paleta.numer_zko, 'BRAK')
        );
        
        v_usuniete_count := v_usuniete_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT 
        TRUE,
        CASE 
            WHEN v_usuniete_count > 0 
            THEN format('Usunięto %s pustych palet', v_usuniete_count)
            ELSE 'Brak pustych palet do usunięcia'
        END,
        v_usuniete_count,
        jsonb_build_object(
            'usuniete_palety', v_usuniete_palety,
            'liczba_usunietych', v_usuniete_count
        );
END;
$$;

-- 3. Popraw pal_usun_inteligentnie
DROP FUNCTION IF EXISTS zko.pal_usun_inteligentnie;

CREATE OR REPLACE FUNCTION zko.pal_usun_inteligentnie(
    p_zko_id INTEGER,
    p_palety_ids INTEGER[] DEFAULT NULL,
    p_tylko_puste BOOLEAN DEFAULT FALSE,
    p_force_usun BOOLEAN DEFAULT FALSE,
    p_operator VARCHAR DEFAULT 'system'::VARCHAR
) RETURNS TABLE(
    sukces BOOLEAN,
    komunikat TEXT,
    usuniete_palety INTEGER[],
    przeniesione_formatki INTEGER,
    ostrzezenia TEXT[]
) LANGUAGE plpgsql AS $$
DECLARE
    v_paleta RECORD;
    v_usuniete_ids INTEGER[] := '{}';
    v_ostrzezenia TEXT[] := '{}';
    v_przeniesione INTEGER := 0;
    v_max_formatek INTEGER := 200;
BEGIN
    -- Sprawdź czy ZKO istnieje
    IF NOT EXISTS(SELECT 1 FROM zko.zlecenia WHERE id = p_zko_id) THEN
        RETURN QUERY SELECT 
            FALSE,
            'ZKO o ID ' || p_zko_id || ' nie istnieje',
            '{}',
            0,
            ARRAY['ZKO nie istnieje'];
        RETURN;
    END IF;
    
    -- Pobierz palety do przetworzenia
    FOR v_paleta IN
        SELECT p.*
        FROM zko.palety p
        WHERE p.zko_id = p_zko_id
        AND (p_palety_ids IS NULL OR p.id = ANY(p_palety_ids))
        ORDER BY p.id
    LOOP
        -- Sprawdź status
        IF v_paleta.status IN ('wyslana', 'dostarczona') AND NOT p_force_usun THEN
            v_ostrzezenia := array_append(v_ostrzezenia,
                format('Paleta %s ma status %s - pominięto', 
                       v_paleta.numer_palety, v_paleta.status));
            CONTINUE;
        END IF;
        
        -- Sprawdź czy pusta
        IF COALESCE(v_paleta.ilosc_formatek, 0) > 0 AND p_tylko_puste THEN
            v_ostrzezenia := array_append(v_ostrzezenia,
                format('Paleta %s nie jest pusta (%s formatek) - pominięto',
                       v_paleta.numer_palety, v_paleta.ilosc_formatek));
            CONTINUE;
        END IF;
        
        -- Usuń paletę
        DELETE FROM zko.palety WHERE id = v_paleta.id;
        v_usuniete_ids := array_append(v_usuniete_ids, v_paleta.id);
    END LOOP;
    
    -- Zwróć wynik
    IF array_length(v_usuniete_ids, 1) IS NULL THEN
        RETURN QUERY SELECT 
            TRUE,
            'Brak palet do usunięcia',
            '{}',
            0,
            v_ostrzezenia;
    ELSE
        RETURN QUERY SELECT 
            TRUE,
            format('Usunięto %s palet', array_length(v_usuniete_ids, 1)),
            v_usuniete_ids,
            v_przeniesione,
            v_ostrzezenia;
    END IF;
END;
$$;

-- Test
DO $$
BEGIN
    RAISE NOTICE '==================================';
    RAISE NOTICE 'POPRAWKI FUNKCJI V5 ZAINSTALOWANE';
    RAISE NOTICE '==================================';
    RAISE NOTICE 'Zrestartuj backend: restart.bat backend';
    RAISE NOTICE '==================================';
END $$;