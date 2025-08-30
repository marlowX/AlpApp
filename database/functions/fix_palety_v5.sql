-- Poprawka dla funkcji pal_planuj_inteligentnie_v5
-- Usuwa odwołanie do nieistniejącej kolumny data_dostawy

DROP FUNCTION IF EXISTS zko.pal_planuj_inteligentnie_v5 CASCADE;

CREATE OR REPLACE FUNCTION zko.pal_planuj_inteligentnie_v5(
    p_zko_id INTEGER,
    p_strategia VARCHAR DEFAULT 'inteligentna',
    p_max_wysokosc_mm INTEGER DEFAULT 1440,
    p_max_formatek_na_palete INTEGER DEFAULT 200,
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
    v_zko_info RECORD;
    v_formatki_do_rozplanowania RECORD;
    v_paleta_id INTEGER;
    v_palety_ids INTEGER[] := '{}';
    v_plan JSONB := '{}';
    v_stats JSONB;
    v_istniejace_palety INTEGER;
    v_formatki_total INTEGER := 0;
    v_formatki_rozplanowane INTEGER := 0;
    v_srednia_wysokosc NUMERIC;
    v_srednie_wykorzystanie NUMERIC;
BEGIN
    -- Sprawdź czy ZKO istnieje
    SELECT z.*, z.numer_zko -- Usunięto z.data_dostawy
    INTO v_zko_info
    FROM zko.zlecenia z
    WHERE z.id = p_zko_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE,
            'ZKO o ID ' || p_zko_id || ' nie istnieje',
            '{}',
            '{}'::JSONB,
            '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Sprawdź czy są już palety
    SELECT COUNT(*) INTO v_istniejace_palety
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    IF v_istniejace_palety > 0 AND NOT p_nadpisz_istniejace THEN
        RETURN QUERY SELECT 
            FALSE,
            format('ZKO %s ma już %s palet. Użyj parametru nadpisz_istniejace=true aby je zastąpić.',
                   v_zko_info.numer_zko, v_istniejace_palety),
            '{}',
            '{}'::JSONB,
            jsonb_build_object(
                'istniejace_palety', v_istniejace_palety,
                'strategia_uzyta', p_strategia
            );
        RETURN;
    END IF;
    
    -- Jeśli nadpisujemy, usuń istniejące palety
    IF p_nadpisz_istniejace AND v_istniejace_palety > 0 THEN
        -- Najpierw usuń historię (foreign key constraint)
        DELETE FROM zko.palety_historia 
        WHERE paleta_id IN (SELECT id FROM zko.palety WHERE zko_id = p_zko_id);
        
        -- Teraz usuń palety
        DELETE FROM zko.palety WHERE zko_id = p_zko_id;
    END IF;
    
    -- Pobierz formatki do rozplanowania
    SELECT COUNT(*) INTO v_formatki_total
    FROM zko.pozycje_formatki pf
    JOIN zko.pozycje p ON p.id = pf.pozycja_id
    WHERE p.zko_id = p_zko_id;
    
    IF v_formatki_total = 0 THEN
        RETURN QUERY SELECT 
            FALSE,
            'Brak formatek do rozplanowania w ZKO ' || v_zko_info.numer_zko,
            '{}',
            '{}'::JSONB,
            jsonb_build_object(
                'formatki_total', 0,
                'strategia_uzyta', p_strategia
            );
        RETURN;
    END IF;
    
    -- Wybierz strategię planowania
    CASE p_strategia
        WHEN 'inteligentna' THEN
            -- Strategia inteligentna - priorytet dla oklejania, potem kolory
            FOR v_formatki_do_rozplanowania IN
                SELECT 
                    array_agg(pf.id ORDER BY pf.id) as formatki_ids,
                    p.kolor_plyty,
                    p.wymaga_oklejania,
                    COUNT(*) as ilosc,
                    SUM(pf.szer_po_obrebie * pf.wys_po_obrebie / 1000000.0) as powierzchnia_m2
                FROM zko.pozycje_formatki pf
                JOIN zko.pozycje p ON p.id = pf.pozycja_id
                WHERE p.zko_id = p_zko_id
                GROUP BY p.kolor_plyty, p.wymaga_oklejania
                ORDER BY 
                    p.wymaga_oklejania DESC NULLS LAST,
                    p.kolor_plyty
            LOOP
                PERFORM zko._pal_utworz_i_przypisz_v5(
                    p_zko_id,
                    v_formatki_do_rozplanowania.formatki_ids,
                    p_max_wysokosc_mm,
                    p_max_formatek_na_palete,
                    p_max_waga_kg,
                    p_grubosc_plyty,
                    p_typ_palety,
                    p_operator
                );
                v_formatki_rozplanowane := v_formatki_rozplanowane + v_formatki_do_rozplanowania.ilosc;
            END LOOP;
            
        WHEN 'kolor' THEN
            -- Strategia kolorystyczna - osobne palety dla każdego koloru
            FOR v_formatki_do_rozplanowania IN
                SELECT 
                    array_agg(pf.id ORDER BY pf.id) as formatki_ids,
                    p.kolor_plyty,
                    COUNT(*) as ilosc
                FROM zko.pozycje_formatki pf
                JOIN zko.pozycje p ON p.id = pf.pozycja_id
                WHERE p.zko_id = p_zko_id
                GROUP BY p.kolor_plyty
                ORDER BY p.kolor_plyty
            LOOP
                PERFORM zko._pal_utworz_i_przypisz_v5(
                    p_zko_id,
                    v_formatki_do_rozplanowania.formatki_ids,
                    p_max_wysokosc_mm,
                    p_max_formatek_na_palete,
                    p_max_waga_kg,
                    p_grubosc_plyty,
                    p_typ_palety,
                    p_operator
                );
                v_formatki_rozplanowane := v_formatki_rozplanowane + v_formatki_do_rozplanowania.ilosc;
            END LOOP;
            
        WHEN 'rozmiar' THEN
            -- Strategia rozmiarowa - duże formatki na dole, małe na górze
            FOR v_formatki_do_rozplanowania IN
                SELECT 
                    array_agg(pf.id ORDER BY 
                        pf.szer_po_obrebie * pf.wys_po_obrebie DESC,
                        pf.id
                    ) as formatki_ids,
                    COUNT(*) as ilosc
                FROM zko.pozycje_formatki pf
                JOIN zko.pozycje p ON p.id = pf.pozycja_id
                WHERE p.zko_id = p_zko_id
            LOOP
                PERFORM zko._pal_utworz_i_przypisz_v5(
                    p_zko_id,
                    v_formatki_do_rozplanowania.formatki_ids,
                    p_max_wysokosc_mm,
                    p_max_formatek_na_palete,
                    p_max_waga_kg,
                    p_grubosc_plyty,
                    p_typ_palety,
                    p_operator
                );
                v_formatki_rozplanowane := v_formatki_rozplanowane + v_formatki_do_rozplanowania.ilosc;
            END LOOP;
            
        WHEN 'oklejanie' THEN
            -- Strategia oklejania - formatki wymagające oklejania osobno
            FOR v_formatki_do_rozplanowania IN
                SELECT 
                    array_agg(pf.id ORDER BY pf.id) as formatki_ids,
                    p.wymaga_oklejania,
                    COUNT(*) as ilosc
                FROM zko.pozycje_formatki pf
                JOIN zko.pozycje p ON p.id = pf.pozycja_id
                WHERE p.zko_id = p_zko_id
                GROUP BY p.wymaga_oklejania
                ORDER BY p.wymaga_oklejania DESC NULLS LAST
            LOOP
                PERFORM zko._pal_utworz_i_przypisz_v5(
                    p_zko_id,
                    v_formatki_do_rozplanowania.formatki_ids,
                    p_max_wysokosc_mm,
                    p_max_formatek_na_palete,
                    p_max_waga_kg,
                    p_grubosc_plyty,
                    p_typ_palety,
                    p_operator
                );
                v_formatki_rozplanowane := v_formatki_rozplanowane + v_formatki_do_rozplanowania.ilosc;
            END LOOP;
            
        ELSE
            -- Domyślna strategia - optymalizacja wykorzystania
            FOR v_formatki_do_rozplanowania IN
                SELECT 
                    array_agg(pf.id ORDER BY pf.id) as formatki_ids,
                    COUNT(*) as ilosc
                FROM zko.pozycje_formatki pf
                JOIN zko.pozycje p ON p.id = pf.pozycja_id
                WHERE p.zko_id = p_zko_id
            LOOP
                PERFORM zko._pal_utworz_i_przypisz_v5(
                    p_zko_id,
                    v_formatki_do_rozplanowania.formatki_ids,
                    p_max_wysokosc_mm,
                    p_max_formatek_na_palete,
                    p_max_waga_kg,
                    p_grubosc_plyty,
                    p_typ_palety,
                    p_operator
                );
                v_formatki_rozplanowane := v_formatki_rozplanowane + v_formatki_do_rozplanowania.ilosc;
            END LOOP;
    END CASE;
    
    -- Pobierz utworzone palety
    SELECT array_agg(id ORDER BY id) INTO v_palety_ids
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    -- Oblicz statystyki
    SELECT 
        AVG(wysokosc_stosu) as srednia_wysokosc,
        AVG(COALESCE(wysokosc_stosu / NULLIF(p_max_wysokosc_mm, 0) * 100, 0)) as srednie_wykorzystanie
    INTO v_srednia_wysokosc, v_srednie_wykorzystanie
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    -- Przygotuj plan szczegółowy
    SELECT jsonb_agg(
        jsonb_build_object(
            'paleta_id', p.id,
            'numer_palety', p.numer_palety,
            'ilosc_formatek', COALESCE(p.ilosc_formatek, 0),
            'wysokosc_stosu', p.wysokosc_stosu,
            'waga_kg', p.waga_kg,
            'wykorzystanie_procent', COALESCE(p.wysokosc_stosu / NULLIF(p_max_wysokosc_mm, 0) * 100, 0)
        ) ORDER BY p.id
    ) INTO v_plan
    FROM zko.palety p
    WHERE p.zko_id = p_zko_id;
    
    -- Przygotuj statystyki
    v_stats := jsonb_build_object(
        'strategia_uzyta', p_strategia,
        'palety_utworzone', array_length(v_palety_ids, 1),
        'formatki_rozplanowane', v_formatki_rozplanowane,
        'formatki_total', v_formatki_total,
        'srednia_wysokosc_mm', COALESCE(v_srednia_wysokosc, 0),
        'srednie_wykorzystanie', COALESCE(v_srednie_wykorzystanie, 0),
        'max_wysokosc_mm', p_max_wysokosc_mm,
        'max_waga_kg', p_max_waga_kg
    );
    
    RETURN QUERY SELECT 
        TRUE,
        format('Utworzono %s palet dla ZKO %s używając strategii "%s"',
               array_length(v_palety_ids, 1), v_zko_info.numer_zko, p_strategia),
        v_palety_ids,
        v_plan,
        v_stats;
        
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        FALSE,
        'Błąd planowania: ' || SQLERRM,
        '{}',
        '{}'::JSONB,
        jsonb_build_object(
            'error', SQLERRM,
            'strategia', p_strategia
        );
END;
$$ LANGUAGE plpgsql;

-- Pomocnicza funkcja do tworzenia i przypisywania formatek
CREATE OR REPLACE FUNCTION zko._pal_utworz_i_przypisz_v5(
    p_zko_id INTEGER,
    p_formatki_ids INTEGER[],
    p_max_wysokosc_mm INTEGER,
    p_max_formatek_na_palete INTEGER,
    p_max_waga_kg INTEGER,
    p_grubosc_plyty INTEGER,
    p_typ_palety VARCHAR,
    p_operator VARCHAR
)
RETURNS VOID AS $$
DECLARE
    v_paleta_id INTEGER;
    v_numer_palety VARCHAR;
    v_batch_formatki INTEGER[];
    v_batch_size INTEGER;
    v_offset INTEGER := 1;
    v_total_formatki INTEGER;
    v_paleta_nr INTEGER := 1;
BEGIN
    IF p_formatki_ids IS NULL OR array_length(p_formatki_ids, 1) IS NULL THEN
        RETURN;
    END IF;
    
    v_total_formatki := array_length(p_formatki_ids, 1);
    
    -- Przetwarzaj formatki w partiach
    WHILE v_offset <= v_total_formatki LOOP
        -- Określ rozmiar partii
        v_batch_size := LEAST(p_max_formatek_na_palete, v_total_formatki - v_offset + 1);
        
        -- Wyciągnij partię formatek
        v_batch_formatki := p_formatki_ids[v_offset:v_offset + v_batch_size - 1];
        
        -- Znajdź wolną paletę lub utwórz nową
        SELECT id INTO v_paleta_id
        FROM zko.palety
        WHERE zko_id = p_zko_id
        AND status = 'otwarta'
        AND COALESCE(ilosc_formatek, 0) + v_batch_size <= p_max_formatek_na_palete
        AND COALESCE(wysokosc_stosu, 0) + (v_batch_size * p_grubosc_plyty) <= p_max_wysokosc_mm
        LIMIT 1;
        
        IF v_paleta_id IS NULL THEN
            -- Utwórz nową paletę
            SELECT COUNT(*) + 1 INTO v_paleta_nr FROM zko.palety WHERE zko_id = p_zko_id;
            v_numer_palety := format('PAL-ZKO-%s-%s', 
                                     LPAD(p_zko_id::TEXT, 5, '0'),
                                     LPAD(v_paleta_nr::TEXT, 3, '0'));
            
            INSERT INTO zko.palety (
                zko_id,
                numer_palety,
                kierunek,
                status,
                typ_palety,
                formatki_ids,
                ilosc_formatek,
                wysokosc_stosu,
                waga_kg
            ) VALUES (
                p_zko_id,
                v_numer_palety,
                'wewnetrzny',
                'otwarta',
                p_typ_palety,
                v_batch_formatki,
                v_batch_size,
                v_batch_size * p_grubosc_plyty,
                v_batch_size * 0.7 -- Przybliżona waga
            ) RETURNING id INTO v_paleta_id;
        ELSE
            -- Dodaj formatki do istniejącej palety
            UPDATE zko.palety
            SET formatki_ids = COALESCE(formatki_ids, '{}') || v_batch_formatki,
                ilosc_formatek = COALESCE(ilosc_formatek, 0) + v_batch_size,
                wysokosc_stosu = COALESCE(wysokosc_stosu, 0) + (v_batch_size * p_grubosc_plyty),
                waga_kg = COALESCE(waga_kg, 0) + (v_batch_size * 0.7)
            WHERE id = v_paleta_id;
        END IF;
        
        v_offset := v_offset + v_batch_size;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Poprawka dla funkcji pal_usun_inteligentnie
-- Naprawia problem z foreign key constraint
CREATE OR REPLACE FUNCTION zko.pal_usun_inteligentnie(
    p_zko_id INTEGER, 
    p_palety_ids INTEGER[] DEFAULT NULL, 
    p_tylko_puste BOOLEAN DEFAULT FALSE, 
    p_force_usun BOOLEAN DEFAULT FALSE, 
    p_operator VARCHAR DEFAULT 'system'
)
RETURNS TABLE(
    sukces BOOLEAN, 
    komunikat TEXT, 
    usuniete_palety INTEGER[], 
    przeniesione_formatki INTEGER, 
    ostrzezenia TEXT[]
) AS $$
DECLARE
    v_paleta RECORD;
    v_usuniete_ids INTEGER[] := '{}';
    v_ostrzezenia TEXT[] := '{}';
    v_przeniesione INTEGER := 0;
    v_paleta_docelowa INTEGER;
    v_max_formatek_na_palete INTEGER := 200;
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
            v_ostrzezenia := array_append(v_ostrzezenia,
                format('Paleta %s ma status %s - nie można usunąć bez force_usun', 
                       v_paleta.numer_palety, v_paleta.status));
            CONTINUE;
        END IF;
        
        -- Jeśli paleta ma formatki i nie usuwamy na siłę
        IF COALESCE(array_length(v_paleta.formatki_ids, 1), 0) > 0 THEN
            IF p_tylko_puste THEN
                v_ostrzezenia := array_append(v_ostrzezenia,
                    format('Paleta %s nie jest pusta (%s formatek) - pominięto',
                           v_paleta.numer_palety, COALESCE(v_paleta.ilosc_formatek, 0)));
                CONTINUE;
            END IF;
            
            -- Znajdź inną paletę do przeniesienia formatek
            SELECT p2.id INTO v_paleta_docelowa
            FROM zko.palety p2
            WHERE p2.zko_id = p_zko_id
            AND p2.id != v_paleta.id
            AND p2.status NOT IN ('wyslana', 'dostarczona', 'pelna')
            AND COALESCE(p2.ilosc_formatek, 0) + COALESCE(v_paleta.ilosc_formatek, 0) <= v_max_formatek_na_palete
            ORDER BY COALESCE(p2.ilosc_formatek, 0) ASC
            LIMIT 1;
            
            IF v_paleta_docelowa IS NOT NULL THEN
                -- Przenieś formatki
                UPDATE zko.palety
                SET formatki_ids = COALESCE(formatki_ids, '{}') || v_paleta.formatki_ids,
                    ilosc_formatek = COALESCE(ilosc_formatek, 0) + COALESCE(v_paleta.ilosc_formatek, 0),
                    wysokosc_stosu = COALESCE(wysokosc_stosu, 0) + COALESCE(v_paleta.wysokosc_stosu, 0),
                    waga_kg = COALESCE(waga_kg, 0) + COALESCE(v_paleta.waga_kg, 0)
                WHERE id = v_paleta_docelowa;
                
                v_przeniesione := v_przeniesione + COALESCE(v_paleta.ilosc_formatek, 0);
            ELSE
                v_ostrzezenia := array_append(v_ostrzezenia,
                    format('Nie można przenieść formatek z palety %s - brak miejsca na innych paletach',
                           v_paleta.numer_palety));
                           
                IF NOT p_force_usun THEN
                    CONTINUE;
                END IF;
            END IF;
        END IF;
        
        -- WAŻNE: Usuń najpierw powiązane rekordy (foreign key constraint)
        -- Usuń historię palety
        DELETE FROM zko.palety_historia WHERE paleta_id = v_paleta.id;
        
        -- Usuń paletę
        DELETE FROM zko.palety WHERE id = v_paleta.id;
        v_usuniete_ids := array_append(v_usuniete_ids, v_paleta.id);
    END LOOP;
    
    -- Jeśli nie usunięto żadnych palet
    IF array_length(v_usuniete_ids, 1) IS NULL THEN
        RETURN QUERY SELECT 
            TRUE,
            'Brak palet do usunięcia',
            ARRAY[]::INTEGER[],
            0,
            v_ostrzezenia;
    ELSE
        RETURN QUERY SELECT 
            TRUE,
            format('Usunięto %s palet, przeniesiono %s formatek',
                   COALESCE(array_length(v_usuniete_ids, 1), 0), v_przeniesione),
            v_usuniete_ids,
            v_przeniesione,
            v_ostrzezenia;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Napraw też funkcję pal_wyczysc_puste_v2
CREATE OR REPLACE FUNCTION zko.pal_wyczysc_puste_v2(
    p_zko_id INTEGER DEFAULT NULL,
    p_operator VARCHAR DEFAULT 'system'
)
RETURNS TABLE(
    sukces BOOLEAN,
    komunikat TEXT,
    usuniete INTEGER,
    szczegoly JSONB
) AS $$
DECLARE
    v_usuniete_ids INTEGER[] := '{}';
    v_paleta RECORD;
    v_zko_szczegoly JSONB := '{}';
BEGIN
    -- Usuń puste palety
    FOR v_paleta IN
        SELECT p.id, p.zko_id, p.numer_palety
        FROM zko.palety p
        WHERE (p_zko_id IS NULL OR p.zko_id = p_zko_id)
        AND (COALESCE(p.ilosc_formatek, 0) = 0 OR p.formatki_ids IS NULL OR array_length(p.formatki_ids, 1) IS NULL)
    LOOP
        -- Usuń historię przed usunięciem palety (foreign key constraint)
        DELETE FROM zko.palety_historia WHERE paleta_id = v_paleta.id;
        
        -- Usuń paletę
        DELETE FROM zko.palety WHERE id = v_paleta.id;
        v_usuniete_ids := array_append(v_usuniete_ids, v_paleta.id);
        
        -- Dodaj do szczegółów
        IF NOT v_zko_szczegoly ? v_paleta.zko_id::TEXT THEN
            v_zko_szczegoly := v_zko_szczegoly || 
                jsonb_build_object(v_paleta.zko_id::TEXT, jsonb_build_array());
        END IF;
        
        v_zko_szczegoly := jsonb_set(
            v_zko_szczegoly,
            ARRAY[v_paleta.zko_id::TEXT],
            v_zko_szczegoly->v_paleta.zko_id::TEXT || to_jsonb(v_paleta.numer_palety)
        );
    END LOOP;
    
    RETURN QUERY SELECT 
        TRUE,
        format('Usunięto %s pustych palet', COALESCE(array_length(v_usuniete_ids, 1), 0)),
        COALESCE(array_length(v_usuniete_ids, 1), 0),
        v_zko_szczegoly;
END;
$$ LANGUAGE plpgsql;
