-- ===========================================
-- FUNKCJE USUWANIA I CZYSZCZENIA PALET V5
-- ===========================================

-- 1. INTELIGENTNE USUWANIE PALET
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
    v_paleta_docelowa INTEGER;
    v_formatki_do_przeniesienia INTEGER[];
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
        AND (
            p_palety_ids IS NULL OR 
            p.id = ANY(p_palety_ids)
        )
        ORDER BY p.id
    LOOP
        -- Sprawdź czy paleta może być usunięta
        IF v_paleta.status IN ('wyslana', 'dostarczona') AND NOT p_force_usun THEN
            v_ostrzezenia := v_ostrzezenia || 
                format('Paleta %s ma status %s - nie można usunąć bez force_usun', 
                       v_paleta.numer_palety, v_paleta.status);
            CONTINUE;
        END IF;
        
        -- Jeśli paleta ma formatki i nie usuwamy na siłę
        IF COALESCE(array_length(v_paleta.formatki_ids, 1), 0) > 0 THEN
            IF p_tylko_puste THEN
                v_ostrzezenia := v_ostrzezenia ||
                    format('Paleta %s nie jest pusta (%s formatek) - pominięto',
                           v_paleta.numer_palety, v_paleta.ilosc_formatek);
                CONTINUE;
            END IF;
            
            -- Znajdź inną paletę do przeniesienia formatek
            SELECT p2.id INTO v_paleta_docelowa
            FROM zko.palety p2
            WHERE p2.zko_id = p_zko_id
            AND p2.id != v_paleta.id
            AND p2.status NOT IN ('wyslana', 'dostarczona', 'pelna')
            AND COALESCE(p2.ilosc_formatek, 0) + COALESCE(v_paleta.ilosc_formatek, 0) <= p_max_formatek_na_palete
            ORDER BY p2.ilosc_formatek ASC
            LIMIT 1;
            
            IF v_paleta_docelowa IS NOT NULL THEN
                -- Przenieś formatki
                PERFORM zko.pal_przesun_formatki(
                    v_paleta.id,
                    v_paleta_docelowa,
                    v_paleta.formatki_ids,
                    NULL,
                    p_operator,
                    format('Przeniesienie przed usunięciem palety %s', v_paleta.numer_palety)
                );
                
                v_przeniesione := v_przeniesione + COALESCE(v_paleta.ilosc_formatek, 0);
            ELSE
                v_ostrzezenia := v_ostrzezenia ||
                    format('Nie można przenieść formatek z palety %s - brak miejsca na innych paletach',
                           v_paleta.numer_palety);
                           
                IF NOT p_force_usun THEN
                    CONTINUE;
                END IF;
            END IF;
        END IF;
        
        -- Usuń paletę
        DELETE FROM zko.palety WHERE id = v_paleta.id;
        v_usuniete_ids := v_usuniete_ids || v_paleta.id;
        
        -- Loguj usunięcie
        PERFORM zko.loguj_zmiane_palety(
            v_paleta.id,
            'usuniecie',
            format('Usunięto paletę %s (formatek: %s)', 
                   v_paleta.numer_palety, COALESCE(v_paleta.ilosc_formatek, 0)),
            p_operator
        );
    END LOOP;
    
    RETURN QUERY SELECT 
        TRUE,
        format('Usunięto %s palet, przeniesiono %s formatek',
               array_length(v_usuniete_ids, 1), v_przeniesione),
        v_usuniete_ids,
        v_przeniesione,
        v_ostrzezenia;
END;
$$;

-- 2. FUNKCJA CZYSZCZENIA PUSTYCH PALET (ULEPSZONA)
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
    -- Znajdź puste palety
    FOR v_paleta IN
        SELECT 
            p.id,
            p.numer_palety,
            p.zko_id,
            z.numer_zko
        FROM zko.palety p
        JOIN zko.zlecenia z ON p.zko_id = z.id
        WHERE (p_zko_id IS NULL OR p.zko_id = p_zko_id)
        AND (
            p.formatki_ids IS NULL OR 
            array_length(p.formatki_ids, 1) = 0 OR
            p.ilosc_formatek = 0
        )
        AND p.status IN ('przygotowanie', 'otwarta', 'pusta')
        ORDER BY p.zko_id, p.id
    LOOP
        -- Usuń pustą paletę
        DELETE FROM zko.palety WHERE id = v_paleta.id;
        
        -- Dodaj do listy usuniętych
        v_usuniete_palety := v_usuniete_palety || jsonb_build_object(
            'paleta_id', v_paleta.id,
            'numer_palety', v_paleta.numer_palety,
            'zko_id', v_paleta.zko_id,
            'numer_zko', v_paleta.numer_zko
        );
        
        v_usuniete_count := v_usuniete_count + 1;
        
        -- Loguj
        PERFORM zko.loguj_zmiane_palety(
            v_paleta.id,
            'czyszczenie_pustych',
            format('Usunięto pustą paletę %s z ZKO %s', 
                   v_paleta.numer_palety, v_paleta.numer_zko),
            p_operator
        );
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

-- 3. FUNKCJA REORGANIZACJI PALET
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
BEGIN
    -- Zbierz statystyki przed
    SELECT jsonb_build_object(
        'liczba_palet', COUNT(*),
        'formatki_total', SUM(COALESCE(ilosc_formatek, 0)),
        'srednie_wykorzystanie', AVG(COALESCE(wysokosc_stosu, 0) / 1440.0 * 100),
        'puste_palety', COUNT(*) FILTER (WHERE COALESCE(ilosc_formatek, 0) = 0)
    ) INTO v_stats_przed
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    -- Wyczyść puste palety
    PERFORM zko.pal_wyczysc_puste_v2(p_zko_id, p_operator);
    
    -- Strategia reorganizacji
    IF p_strategia = 'optymalizacja' THEN
        -- Wykorzystaj funkcję planowania z nadpisaniem
        PERFORM zko.pal_planuj_inteligentnie_v5(
            p_zko_id,
            'inteligentna',
            1440,
            200,
            700,
            18,
            'EURO',
            TRUE,
            p_operator,
            TRUE -- nadpisz istniejące
        );
    END IF;
    
    -- Zbierz statystyki po
    SELECT jsonb_build_object(
        'liczba_palet', COUNT(*),
        'formatki_total', SUM(COALESCE(ilosc_formatek, 0)),
        'srednie_wykorzystanie', AVG(COALESCE(wysokosc_stosu, 0) / 1440.0 * 100),
        'puste_palety', COUNT(*) FILTER (WHERE COALESCE(ilosc_formatek, 0) = 0)
    ) INTO v_stats_po
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    RETURN QUERY SELECT 
        TRUE,
        format('Reorganizacja zakończona. Palet: %s → %s',
               v_stats_przed->>'liczba_palet', v_stats_po->>'liczba_palet'),
        v_stats_przed,
        v_stats_po;
END;
$$;