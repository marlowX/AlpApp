-- POPRAWIONA FUNKCJA PLANOWANIA V6 - PRAWIDŁOWA OBSŁUGA ILOŚCI
-- Naprawia błąd gdzie system traktował ID formatek jako sztuki

DROP FUNCTION IF EXISTS zko.pal_planuj_inteligentnie_v6 CASCADE;

CREATE OR REPLACE FUNCTION zko.pal_planuj_inteligentnie_v6(
    p_zko_id INTEGER,
    p_strategia VARCHAR DEFAULT 'inteligentna',
    p_max_wysokosc_mm INTEGER DEFAULT 1440,
    p_max_formatek_na_palete INTEGER DEFAULT 80,  -- Zmniejszone dla bezpieczeństwa
    p_max_waga_kg INTEGER DEFAULT 700,
    p_grubosc_plyty INTEGER DEFAULT 18,
    p_typ_palety VARCHAR DEFAULT 'EURO',
    p_uwzglednij_oklejanie BOOLEAN DEFAULT TRUE,
    p_operator VARCHAR DEFAULT 'system',
    p_nadpisz_istniejace BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    sukces BOOLEAN,
    komunikat TEXT,
    palety_utworzone INTEGER[],
    plan_szczegolowy JSONB,
    statystyki JSONB
) AS $$
DECLARE
    v_numer_zko VARCHAR;
    v_istniejace_palety INTEGER;
    v_sztuk_total INTEGER;  -- RZECZYWISTA liczba sztuk, nie typów!
    v_typy_formatek INTEGER;
    v_palety_ids INTEGER[] := '{}';
    v_liczba_palet INTEGER;
    v_paleta_id INTEGER;
    v_i INTEGER;
    v_sztuk_na_palete INTEGER;
    v_pozostalo_sztuk INTEGER;
BEGIN
    -- Sprawdź czy ZKO istnieje
    SELECT numer_zko INTO v_numer_zko
    FROM zko.zlecenia
    WHERE id = p_zko_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE,
            'ZKO o ID ' || p_zko_id || ' nie istnieje',
            ARRAY[]::INTEGER[],
            '{}'::JSONB,
            '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Sprawdź istniejące palety
    SELECT COUNT(*) INTO v_istniejace_palety
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    IF v_istniejace_palety > 0 AND NOT p_nadpisz_istniejace THEN
        RETURN QUERY SELECT 
            FALSE,
            format('ZKO %s ma już %s palet', v_numer_zko, v_istniejace_palety),
            ARRAY[]::INTEGER[],
            '{}'::JSONB,
            jsonb_build_object('istniejace_palety', v_istniejace_palety);
        RETURN;
    END IF;
    
    -- Usuń istniejące jeśli nadpisujemy
    IF p_nadpisz_istniejace AND v_istniejace_palety > 0 THEN
        DELETE FROM zko.palety_formatki_ilosc 
        WHERE paleta_id IN (SELECT id FROM zko.palety WHERE zko_id = p_zko_id);
        
        DELETE FROM zko.palety_historia 
        WHERE paleta_id IN (SELECT id FROM zko.palety WHERE zko_id = p_zko_id);
        
        DELETE FROM zko.palety WHERE zko_id = p_zko_id;
    END IF;
    
    -- KLUCZOWA POPRAWKA: Policz RZECZYWISTE SZTUKI, nie typy!
    SELECT 
        SUM(pf.ilosc_planowana),  -- Suma wszystkich sztuk
        COUNT(DISTINCT pf.id)     -- Liczba typów formatek
    INTO v_sztuk_total, v_typy_formatek
    FROM zko.pozycje_formatki pf
    JOIN zko.pozycje p ON p.id = pf.pozycja_id
    WHERE p.zko_id = p_zko_id;
    
    IF v_sztuk_total IS NULL OR v_sztuk_total = 0 THEN
        RETURN QUERY SELECT 
            FALSE,
            'Brak formatek do rozplanowania',
            ARRAY[]::INTEGER[],
            '{}'::JSONB,
            jsonb_build_object(
                'formatki_typy': v_typy_formatek,
                'sztuk_total': 0
            );
        RETURN;
    END IF;
    
    -- Oblicz rzeczywistą liczbę palet potrzebną dla SZTUK
    -- Uwzględnij też limit wysokości
    DECLARE
        v_max_sztuk_wysokosc INTEGER;
    BEGIN
        -- Ile sztuk zmieści się przy limicie wysokości
        v_max_sztuk_wysokosc := FLOOR(p_max_wysokosc_mm::NUMERIC / p_grubosc_plyty);
        
        -- Użyj mniejszej wartości z dwóch limitów
        v_sztuk_na_palete := LEAST(p_max_formatek_na_palete, v_max_sztuk_wysokosc);
        
        -- Oblicz liczbę palet
        v_liczba_palet := CEIL(v_sztuk_total::NUMERIC / v_sztuk_na_palete);
    END;
    
    -- Utwórz palety
    v_pozostalo_sztuk := v_sztuk_total;
    
    FOR v_i IN 1..v_liczba_palet LOOP
        DECLARE
            v_sztuk_na_tej_palecie INTEGER;
        BEGIN
            -- Oblicz ile sztuk na tej palecie
            v_sztuk_na_tej_palecie := LEAST(v_sztuk_na_palete, v_pozostalo_sztuk);
            
            INSERT INTO zko.palety (
                zko_id,
                numer_palety,
                kierunek,
                status,
                typ_palety,
                formatki_ids,
                ilosc_formatek,  -- Tu będzie RZECZYWISTA liczba sztuk!
                wysokosc_stosu,
                waga_kg
            ) VALUES (
                p_zko_id,
                format('PAL-ZKO-%s-%s', LPAD(p_zko_id::TEXT, 5, '0'), LPAD(v_i::TEXT, 3, '0')),
                'wewnetrzny',
                'otwarta',
                p_typ_palety,
                ARRAY(SELECT pf.id FROM zko.pozycje_formatki pf 
                      JOIN zko.pozycje p ON p.id = pf.pozycja_id 
                      WHERE p.zko_id = p_zko_id),
                v_sztuk_na_tej_palecie,
                v_sztuk_na_tej_palecie * p_grubosc_plyty,
                v_sztuk_na_tej_palecie * 0.7
            ) RETURNING id INTO v_paleta_id;
            
            v_palety_ids := array_append(v_palety_ids, v_paleta_id);
            v_pozostalo_sztuk := v_pozostalo_sztuk - v_sztuk_na_tej_palecie;
        END;
    END LOOP;
    
    -- Rozdziel formatki na palety proporcjonalnie (w tabeli palety_formatki_ilosc)
    -- To jest uproszczona wersja - równomierny podział
    DECLARE
        v_formatka RECORD;
        v_paleta_idx INTEGER := 1;
        v_sztuk_przydzielonych INTEGER;
    BEGIN
        FOR v_formatka IN
            SELECT pf.id, pf.ilosc_planowana
            FROM zko.pozycje_formatki pf
            JOIN zko.pozycje p ON p.id = pf.pozycja_id
            WHERE p.zko_id = p_zko_id
            ORDER BY pf.ilosc_planowana DESC  -- Największe najpierw
        LOOP
            v_sztuk_przydzielonych := 0;
            
            WHILE v_sztuk_przydzielonych < v_formatka.ilosc_planowana LOOP
                DECLARE
                    v_do_przydzielenia INTEGER;
                    v_current_paleta_id INTEGER;
                BEGIN
                    -- Znajdź paletę z miejscem
                    SELECT p.id INTO v_current_paleta_id
                    FROM zko.palety p
                    WHERE p.id = ANY(v_palety_ids)
                    AND (
                        SELECT COALESCE(SUM(pfi.ilosc), 0)
                        FROM zko.palety_formatki_ilosc pfi
                        WHERE pfi.paleta_id = p.id
                    ) < v_sztuk_na_palete
                    ORDER BY p.id
                    LIMIT 1;
                    
                    IF v_current_paleta_id IS NULL THEN
                        -- Wszystkie palety pełne, użyj ostatniej
                        v_current_paleta_id := v_palety_ids[array_length(v_palety_ids, 1)];
                    END IF;
                    
                    -- Oblicz ile sztuk można dodać
                    v_do_przydzielenia := LEAST(
                        v_formatka.ilosc_planowana - v_sztuk_przydzielonych,
                        v_sztuk_na_palete - COALESCE(
                            (SELECT SUM(ilosc) FROM zko.palety_formatki_ilosc WHERE paleta_id = v_current_paleta_id),
                            0
                        )
                    );
                    
                    IF v_do_przydzielenia > 0 THEN
                        INSERT INTO zko.palety_formatki_ilosc (paleta_id, formatka_id, ilosc)
                        VALUES (v_current_paleta_id, v_formatka.id, v_do_przydzielenia)
                        ON CONFLICT (paleta_id, formatka_id) 
                        DO UPDATE SET ilosc = palety_formatki_ilosc.ilosc + EXCLUDED.ilosc;
                    END IF;
                    
                    v_sztuk_przydzielonych := v_sztuk_przydzielonych + GREATEST(v_do_przydzielenia, 1);
                END;
            END LOOP;
        END LOOP;
    END;
    
    -- Przygotuj statystyki
    DECLARE
        v_plan JSONB;
        v_stats JSONB;
    BEGIN
        SELECT jsonb_agg(
            jsonb_build_object(
                'paleta_id', p.id,
                'numer_palety', p.numer_palety,
                'sztuk_na_palecie', p.ilosc_formatek,
                'wysokosc_mm', p.wysokosc_stosu,
                'waga_kg', p.waga_kg,
                'procent_wykorzystania', ROUND((p.ilosc_formatek::NUMERIC / v_sztuk_na_palete) * 100, 1)
            ) ORDER BY p.id
        ) INTO v_plan
        FROM zko.palety p
        WHERE p.zko_id = p_zko_id;
        
        v_stats := jsonb_build_object(
            'strategia_uzyta', p_strategia,
            'palety_utworzone', array_length(v_palety_ids, 1),
            'typy_formatek', v_typy_formatek,
            'sztuk_total', v_sztuk_total,
            'sztuk_na_palete_limit', v_sztuk_na_palete,
            'srednia_sztuk_na_palete', ROUND(v_sztuk_total::NUMERIC / v_liczba_palet, 1)
        );
        
        RETURN QUERY SELECT 
            TRUE,
            format('Utworzono %s palet dla %s sztuk formatek (ZKO %s)', 
                   array_length(v_palety_ids, 1), v_sztuk_total, v_numer_zko),
            v_palety_ids,
            v_plan,
            v_stats;
    END;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        FALSE,
        'Błąd planowania: ' || SQLERRM,
        ARRAY[]::INTEGER[],
        '{}'::JSONB,
        jsonb_build_object(
            'error', SQLERRM,
            'strategia', p_strategia
        );
END;
$$ LANGUAGE plpgsql;

-- TEST FUNKCJI
-- SELECT * FROM zko.pal_planuj_inteligentnie_v6(28, 'inteligentna', 1440, 80, 700, 18, 'EURO', true, 'system', true);
