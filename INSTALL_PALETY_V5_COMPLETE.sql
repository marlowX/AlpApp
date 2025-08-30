-- =====================================================
-- KOMPLETNA INSTALACJA PALETY V5
-- Wklej całość do pgAdmin Query Tool i wykonaj (F5)
-- =====================================================

-- CZĘŚĆ 1: GŁÓWNA FUNKCJA PLANOWANIA V5
CREATE OR REPLACE FUNCTION zko.pal_planuj_inteligentnie_v5(
    p_zko_id INTEGER,
    p_strategia VARCHAR DEFAULT 'inteligentna'::VARCHAR,
    p_max_wysokosc_mm NUMERIC DEFAULT 1440,
    p_max_formatek_na_palete INTEGER DEFAULT 200,
    p_max_waga_kg NUMERIC DEFAULT 700,
    p_grubosc_plyty NUMERIC DEFAULT 18,
    p_typ_palety VARCHAR DEFAULT 'EURO'::VARCHAR,
    p_uwzglednij_oklejanie BOOLEAN DEFAULT TRUE,
    p_operator VARCHAR DEFAULT 'system'::VARCHAR,
    p_nadpisz_istniejace BOOLEAN DEFAULT FALSE
) RETURNS TABLE(
    sukces BOOLEAN,
    komunikat TEXT,
    palety_utworzone INTEGER[],
    plan_szczegolowy JSONB,
    statystyki JSONB
) LANGUAGE plpgsql AS $$
DECLARE
    v_zko_info RECORD;
    v_istniejace_palety INTEGER;
    v_plan_palety JSONB := '[]'::jsonb;
    v_palety_ids INTEGER[] := '{}';
    v_pozycja RECORD;
    v_formatka RECORD;
    v_paleta_nr INTEGER := 1;
    v_current_paleta JSONB;
    v_current_wysokosc NUMERIC := 0;
    v_current_ilosc INTEGER := 0;
    v_current_waga NUMERIC := 0;
    v_current_kolory TEXT[] := '{}';
    v_current_formatki JSONB := '[]'::jsonb;
    v_paleta_id INTEGER;
    v_total_palety INTEGER := 0;
    v_total_formatki INTEGER := 0;
BEGIN
    -- Sprawdź czy ZKO istnieje
    SELECT z.*, COUNT(p.id) as pozycje_count
    INTO v_zko_info
    FROM zko.zlecenia z
    LEFT JOIN zko.pozycje p ON p.zko_id = z.id
    WHERE z.id = p_zko_id
    GROUP BY z.id, z.numer_zko, z.kooperant, z.status, z.created_at;
    
    IF v_zko_info.id IS NULL THEN
        RETURN QUERY SELECT 
            FALSE, 
            'ZKO o ID ' || p_zko_id || ' nie istnieje',
            '{}',
            '{"error": "zko_not_found"}'::jsonb,
            '{}'::jsonb;
        RETURN;
    END IF;
    
    -- Sprawdź istniejące palety
    SELECT COUNT(*)
    INTO v_istniejace_palety
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    IF v_istniejace_palety > 0 AND NOT p_nadpisz_istniejace THEN
        RETURN QUERY SELECT 
            FALSE,
            format('ZKO %s ma już %s palet. Użyj p_nadpisz_istniejace = TRUE aby je zastąpić',
                   v_zko_info.numer_zko, v_istniejace_palety),
            '{}',
            jsonb_build_object(
                'istniejace_palety', v_istniejace_palety,
                'wymagane_nadpisanie', true
            ),
            jsonb_build_object('istniejace_palety', v_istniejace_palety);
        RETURN;
    END IF;
    
    -- Usuń istniejące palety jeśli wymagane
    IF v_istniejace_palety > 0 AND p_nadpisz_istniejace THEN
        DELETE FROM zko.palety WHERE zko_id = p_zko_id;
    END IF;
    
    -- ALGORYTM PLANOWANIA
    FOR v_pozycja IN 
        SELECT p.id as pozycja_id, p.kolor_plyty, p.kolejnosc
        FROM zko.pozycje p
        WHERE p.zko_id = p_zko_id
        ORDER BY p.kolor_plyty, p.kolejnosc
    LOOP
        FOR v_formatka IN
            SELECT pf.*, 
                   ROUND(pf.dlugosc * pf.szerokosc / 1000000, 4) as powierzchnia_m2,
                   ROUND(pf.ilosc_planowana * p_grubosc_plyty, 2) as wysokosc_mm
            FROM zko.pozycje_formatki pf
            WHERE pf.pozycja_id = v_pozycja.pozycja_id
            ORDER BY pf.dlugosc DESC, pf.szerokosc DESC
        LOOP
            -- Sprawdź limity
            IF v_current_wysokosc + v_formatka.wysokosc_mm > p_max_wysokosc_mm OR
               v_current_ilosc + v_formatka.ilosc_planowana > p_max_formatek_na_palete
            THEN
                -- Zapisz obecną paletę
                IF v_current_ilosc > 0 THEN
                    INSERT INTO zko.palety (
                        zko_id, numer_palety, kierunek, status, typ_palety,
                        formatki_ids, ilosc_formatek, wysokosc_stosu, waga_kg,
                        kolory_na_palecie, operator_pakujacy, uwagi
                    ) VALUES (
                        p_zko_id,
                        format('PAL-%s-%s', v_zko_info.numer_zko, LPAD(v_paleta_nr::text, 3, '0')),
                        'wszerz',
                        'przygotowanie',
                        p_typ_palety,
                        '{}',
                        v_current_ilosc,
                        v_current_wysokosc,
                        v_current_waga,
                        array_to_string(v_current_kolory, ', '),
                        p_operator,
                        format('Strategia: %s, Auto-planowanie v5', p_strategia)
                    ) RETURNING id INTO v_paleta_id;
                    
                    v_palety_ids := v_palety_ids || v_paleta_id;
                    v_total_palety := v_total_palety + 1;
                    v_paleta_nr := v_paleta_nr + 1;
                    
                    -- Reset
                    v_current_formatki := '[]'::jsonb;
                    v_current_wysokosc := 0;
                    v_current_ilosc := 0;
                    v_current_waga := 0;
                    v_current_kolory := '{}';
                END IF;
            END IF;
            
            -- Dodaj formatkę
            v_current_wysokosc := v_current_wysokosc + v_formatka.wysokosc_mm;
            v_current_ilosc := v_current_ilosc + v_formatka.ilosc_planowana;
            v_current_waga := v_current_waga + (v_formatka.powierzchnia_m2 * v_formatka.ilosc_planowana * 12.6);
            v_current_kolory := array_append(v_current_kolory, v_pozycja.kolor_plyty);
            v_current_kolory := array(SELECT DISTINCT unnest(v_current_kolory));
            v_total_formatki := v_total_formatki + v_formatka.ilosc_planowana;
        END LOOP;
    END LOOP;
    
    -- Zapisz ostatnią paletę
    IF v_current_ilosc > 0 THEN
        INSERT INTO zko.palety (
            zko_id, numer_palety, kierunek, status, typ_palety,
            formatki_ids, ilosc_formatek, wysokosc_stosu, waga_kg,
            kolory_na_palecie, operator_pakujacy, uwagi
        ) VALUES (
            p_zko_id,
            format('PAL-%s-%s', v_zko_info.numer_zko, LPAD(v_paleta_nr::text, 3, '0')),
            'wszerz',
            'przygotowanie',
            p_typ_palety,
            '{}',
            v_current_ilosc,
            v_current_wysokosc,
            v_current_waga,
            array_to_string(v_current_kolory, ', '),
            p_operator,
            format('Strategia: %s, Auto-planowanie v5', p_strategia)
        ) RETURNING id INTO v_paleta_id;
        
        v_palety_ids := v_palety_ids || v_paleta_id;
        v_total_palety := v_total_palety + 1;
    END IF;
    
    RETURN QUERY SELECT 
        TRUE,
        format('Utworzono %s palet dla ZKO %s używając strategii "%s"',
               v_total_palety, v_zko_info.numer_zko, p_strategia),
        v_palety_ids,
        v_plan_palety,
        jsonb_build_object(
            'palety_utworzone', v_total_palety,
            'formatki_rozplanowane', v_total_formatki,
            'pozycje_przetworzone', v_zko_info.pozycje_count,
            'strategia_uzyta', p_strategia,
            'srednie_wykorzystanie', 
                CASE WHEN v_total_palety > 0 
                THEN ROUND((v_total_formatki::NUMERIC / (v_total_palety * p_max_formatek_na_palete)) * 100, 2)
                ELSE 0 END
        );
END;
$$;

-- CZĘŚĆ 2: INTELIGENTNE USUWANIE
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
BEGIN
    IF NOT EXISTS(SELECT 1 FROM zko.zlecenia WHERE id = p_zko_id) THEN
        RETURN QUERY SELECT 
            FALSE,
            'ZKO o ID ' || p_zko_id || ' nie istnieje',
            '{}',
            0,
            ARRAY['ZKO nie istnieje'];
        RETURN;
    END IF;
    
    FOR v_paleta IN
        SELECT p.*
        FROM zko.palety p
        WHERE p.zko_id = p_zko_id
        AND (p_palety_ids IS NULL OR p.id = ANY(p_palety_ids))
        ORDER BY p.id
    LOOP
        IF v_paleta.status IN ('wyslana', 'dostarczona') AND NOT p_force_usun THEN
            v_ostrzezenia := v_ostrzezenia || 
                format('Paleta %s ma status %s - nie można usunąć', 
                       v_paleta.numer_palety, v_paleta.status);
            CONTINUE;
        END IF;
        
        IF COALESCE(v_paleta.ilosc_formatek, 0) > 0 AND p_tylko_puste THEN
            v_ostrzezenia := v_ostrzezenia ||
                format('Paleta %s nie jest pusta (%s formatek)',
                       v_paleta.numer_palety, v_paleta.ilosc_formatek);
            CONTINUE;
        END IF;
        
        DELETE FROM zko.palety WHERE id = v_paleta.id;
        v_usuniete_ids := v_usuniete_ids || v_paleta.id;
    END LOOP;
    
    RETURN QUERY SELECT 
        TRUE,
        format('Usunięto %s palet', array_length(v_usuniete_ids, 1)),
        v_usuniete_ids,
        v_przeniesione,
        v_ostrzezenia;
END;
$$;

-- CZĘŚĆ 3: CZYSZCZENIE PUSTYCH
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
BEGIN
    DELETE FROM zko.palety
    WHERE (p_zko_id IS NULL OR zko_id = p_zko_id)
    AND (formatki_ids IS NULL OR array_length(formatki_ids, 1) = 0 OR ilosc_formatek = 0)
    AND status IN ('przygotowanie', 'otwarta', 'pusta');
    
    GET DIAGNOSTICS v_usuniete_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        TRUE,
        format('Usunięto %s pustych palet', v_usuniete_count),
        v_usuniete_count,
        jsonb_build_object('liczba_usunietych', v_usuniete_count);
END;
$$;

-- CZĘŚĆ 4: REORGANIZACJA
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
    SELECT jsonb_build_object(
        'liczba_palet', COUNT(*),
        'formatki_total', SUM(COALESCE(ilosc_formatek, 0)),
        'srednie_wykorzystanie', AVG(COALESCE(wysokosc_stosu, 0) / 1440.0 * 100)
    ) INTO v_stats_przed
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    PERFORM zko.pal_wyczysc_puste_v2(p_zko_id, p_operator);
    
    IF p_strategia = 'optymalizacja' THEN
        PERFORM zko.pal_planuj_inteligentnie_v5(
            p_zko_id, 'inteligentna', 1440, 200, 700, 18, 'EURO', TRUE, p_operator, TRUE
        );
    END IF;
    
    SELECT jsonb_build_object(
        'liczba_palet', COUNT(*),
        'formatki_total', SUM(COALESCE(ilosc_formatek, 0)),
        'srednie_wykorzystanie', AVG(COALESCE(wysokosc_stosu, 0) / 1440.0 * 100)
    ) INTO v_stats_po
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    RETURN QUERY SELECT 
        TRUE,
        format('Reorganizacja zakończona'),
        v_stats_przed,
        v_stats_po;
END;
$$;

-- TEST INSTALACJI
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
    
    RAISE NOTICE '====================================';
    RAISE NOTICE 'INSTALACJA PALETY V5 ZAKOŃCZONA!';
    RAISE NOTICE 'Zainstalowano % z 4 funkcji', v_count;
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Teraz zrestartuj backend:';
    RAISE NOTICE 'restart.bat backend';
    RAISE NOTICE '====================================';
END $$;