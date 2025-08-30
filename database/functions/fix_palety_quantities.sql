-- POPRAWKA SYSTEMU PALET - PRAWIDŁOWA OBSŁUGA ILOŚCI FORMATEK
-- Problem: System traktuje ID formatek jako pojedyncze sztuki, ignorując ilosc_planowana
-- Rozwiązanie: Nowa struktura danych i logika planowania

-- =====================================================
-- 1. DODAJ NOWĄ TABELĘ DO PRZECHOWYWANIA ILOŚCI NA PALETACH
-- =====================================================

CREATE TABLE IF NOT EXISTS zko.palety_formatki_ilosc (
    id SERIAL PRIMARY KEY,
    paleta_id INTEGER NOT NULL REFERENCES zko.palety(id) ON DELETE CASCADE,
    formatka_id INTEGER NOT NULL REFERENCES zko.pozycje_formatki(id),
    ilosc INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(paleta_id, formatka_id)
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_palety_formatki_paleta ON zko.palety_formatki_ilosc(paleta_id);
CREATE INDEX IF NOT EXISTS idx_palety_formatki_formatka ON zko.palety_formatki_ilosc(formatka_id);

-- =====================================================
-- 2. NOWA FUNKCJA PLANOWANIA Z OBSŁUGĄ ILOŚCI
-- =====================================================

CREATE OR REPLACE FUNCTION zko.pal_planuj_inteligentnie_v6(
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
    v_numer_zko VARCHAR;
    v_istniejace_palety INTEGER;
    v_formatki_total INTEGER;
    v_sztuk_total INTEGER;
    v_palety_ids INTEGER[] := '{}';
    v_liczba_palet INTEGER;
    v_paleta_id INTEGER;
    v_i INTEGER;
    v_formatka RECORD;
    v_pozostalo_sztuk INTEGER;
    v_sztuk_na_palete INTEGER;
    v_current_paleta_idx INTEGER := 1;
    v_current_paleta_sztuk INTEGER := 0;
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
    
    -- Policz RZECZYWISTĄ liczbę sztuk do rozplanowania
    SELECT 
        COUNT(DISTINCT pf.id),
        SUM(pf.ilosc_planowana)
    INTO v_formatki_total, v_sztuk_total
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
                'formatki_total', COALESCE(v_formatki_total, 0),
                'sztuk_total', 0
            );
        RETURN;
    END IF;
    
    -- Oblicz liczbę palet potrzebnych dla wszystkich SZTUK
    v_liczba_palet := GREATEST(1, CEIL(v_sztuk_total::NUMERIC / p_max_formatek_na_palete));
    
    -- Utwórz palety
    FOR v_i IN 1..v_liczba_palet LOOP
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
            format('PAL-ZKO-%s-%s', LPAD(p_zko_id::TEXT, 5, '0'), LPAD(v_i::TEXT, 3, '0')),
            'wewnetrzny',
            'otwarta',
            p_typ_palety,
            '{}',
            0,
            0,
            0
        ) RETURNING id INTO v_paleta_id;
        
        v_palety_ids := array_append(v_palety_ids, v_paleta_id);
    END LOOP;
    
    -- Rozplanuj formatki na palety z uwzględnieniem ILOŚCI
    v_current_paleta_idx := 1;
    v_current_paleta_sztuk := 0;
    
    -- Wybierz strategię sortowania
    FOR v_formatka IN
        SELECT 
            pf.id,
            pf.ilosc_planowana,
            pf.dlugosc,
            pf.szerokosc,
            p.kolor_plyty,
            p.wymaga_oklejania
        FROM zko.pozycje_formatki pf
        JOIN zko.pozycje p ON p.id = pf.pozycja_id
        WHERE p.zko_id = p_zko_id
        ORDER BY 
            CASE p_strategia
                WHEN 'kolor' THEN p.kolor_plyty
                WHEN 'oklejanie' THEN p.wymaga_oklejania::TEXT
                WHEN 'rozmiar' THEN (pf.dlugosc * pf.szerokosc)::TEXT
                ELSE pf.id::TEXT
            END,
            pf.id
    LOOP
        v_pozostalo_sztuk := v_formatka.ilosc_planowana;
        
        WHILE v_pozostalo_sztuk > 0 LOOP
            -- Sprawdź czy trzeba przejść na następną paletę
            IF v_current_paleta_sztuk >= p_max_formatek_na_palete THEN
                v_current_paleta_idx := v_current_paleta_idx + 1;
                v_current_paleta_sztuk := 0;
                
                -- Jeśli brak palet, wróć do pierwszej
                IF v_current_paleta_idx > array_length(v_palety_ids, 1) THEN
                    v_current_paleta_idx := 1;
                END IF;
            END IF;
            
            -- Oblicz ile sztuk zmieści się na obecnej palecie
            v_sztuk_na_palete := LEAST(
                v_pozostalo_sztuk,
                p_max_formatek_na_palete - v_current_paleta_sztuk
            );
            
            -- Dodaj wpis do tabeli palety_formatki_ilosc
            INSERT INTO zko.palety_formatki_ilosc (paleta_id, formatka_id, ilosc)
            VALUES (v_palety_ids[v_current_paleta_idx], v_formatka.id, v_sztuk_na_palete)
            ON CONFLICT (paleta_id, formatka_id) 
            DO UPDATE SET ilosc = palety_formatki_ilosc.ilosc + EXCLUDED.ilosc;
            
            -- Zaktualizuj paletę
            UPDATE zko.palety
            SET formatki_ids = array_append(
                    CASE 
                        WHEN NOT (formatki_ids @> ARRAY[v_formatka.id]) 
                        THEN formatki_ids 
                        ELSE formatki_ids 
                    END, 
                    v_formatka.id
                ),
                ilosc_formatek = ilosc_formatek + v_sztuk_na_palete,
                wysokosc_stosu = wysokosc_stosu + (v_sztuk_na_palete * p_grubosc_plyty),
                waga_kg = waga_kg + (v_sztuk_na_palete * 0.7)
            WHERE id = v_palety_ids[v_current_paleta_idx]
            AND NOT (formatki_ids @> ARRAY[v_formatka.id]);
            
            -- Jeśli formatka już jest, tylko zaktualizuj ilości
            UPDATE zko.palety
            SET ilosc_formatek = ilosc_formatek + v_sztuk_na_palete,
                wysokosc_stosu = wysokosc_stosu + (v_sztuk_na_palete * p_grubosc_plyty),
                waga_kg = waga_kg + (v_sztuk_na_palete * 0.7)
            WHERE id = v_palety_ids[v_current_paleta_idx]
            AND formatki_ids @> ARRAY[v_formatka.id];
            
            v_pozostalo_sztuk := v_pozostalo_sztuk - v_sztuk_na_palete;
            v_current_paleta_sztuk := v_current_paleta_sztuk + v_sztuk_na_palete;
        END LOOP;
    END LOOP;
    
    -- Przygotuj statystyki
    DECLARE
        v_plan JSONB;
        v_stats JSONB;
    BEGIN
        -- Plan szczegółowy
        SELECT jsonb_agg(
            jsonb_build_object(
                'paleta_id', p.id,
                'numer_palety', p.numer_palety,
                'ilosc_formatek', p.ilosc_formatek,
                'wysokosc_stosu', p.wysokosc_stosu,
                'waga_kg', p.waga_kg,
                'formatki', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'formatka_id', pfi.formatka_id,
                            'ilosc', pfi.ilosc
                        )
                    )
                    FROM zko.palety_formatki_ilosc pfi
                    WHERE pfi.paleta_id = p.id
                ),
                'wykorzystanie_procent', ROUND((p.ilosc_formatek::NUMERIC / p_max_formatek_na_palete) * 100, 2)
            ) ORDER BY p.id
        ) INTO v_plan
        FROM zko.palety p
        WHERE p.zko_id = p_zko_id;
        
        -- Statystyki
        v_stats := jsonb_build_object(
            'strategia_uzyta', p_strategia,
            'palety_utworzone', array_length(v_palety_ids, 1),
            'formatki_typy', v_formatki_total,
            'sztuk_total', v_sztuk_total,
            'sztuk_na_palete_srednia', ROUND(v_sztuk_total::NUMERIC / v_liczba_palet, 2),
            'max_formatek_na_palete', p_max_formatek_na_palete
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

-- =====================================================
-- 3. WIDOK DO PODGLĄDU PALET Z ILOŚCIAMI
-- =====================================================

CREATE OR REPLACE VIEW zko.v_palety_szczegoly AS
SELECT 
    p.id,
    p.zko_id,
    p.numer_palety,
    p.status,
    p.kierunek,
    p.typ_palety,
    p.ilosc_formatek as sztuk_total,
    p.wysokosc_stosu,
    p.waga_kg,
    COUNT(DISTINCT pfi.formatka_id) as liczba_typow_formatek,
    STRING_AGG(
        DISTINCT 
        poz.kolor_plyty || ' (' || 
        (SELECT SUM(ilosc) FROM zko.palety_formatki_ilosc WHERE paleta_id = p.id AND formatka_id IN 
            (SELECT id FROM zko.pozycje_formatki pf2 
             JOIN zko.pozycje p2 ON p2.id = pf2.pozycja_id 
             WHERE p2.kolor_plyty = poz.kolor_plyty AND p2.zko_id = p.zko_id)
        ) || ' szt.)',
        ', '
    ) as kolory_z_ilosciami,
    jsonb_agg(
        jsonb_build_object(
            'formatka_id', pfi.formatka_id,
            'nazwa', pf.nazwa_formatki,
            'wymiary', pf.dlugosc || 'x' || pf.szerokosc,
            'ilosc', pfi.ilosc
        )
    ) as formatki_szczegoly
FROM zko.palety p
LEFT JOIN zko.palety_formatki_ilosc pfi ON pfi.paleta_id = p.id
LEFT JOIN zko.pozycje_formatki pf ON pf.id = pfi.formatka_id
LEFT JOIN zko.pozycje poz ON poz.id = pf.pozycja_id
GROUP BY p.id;

-- =====================================================
-- 4. FUNKCJA DO TESTOWANIA NOWEGO SYSTEMU
-- =====================================================

CREATE OR REPLACE FUNCTION zko.test_palety_v6(p_zko_id INTEGER)
RETURNS TABLE(
    info TEXT,
    wartosc TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'ZKO ID'::TEXT, p_zko_id::TEXT
    UNION ALL
    SELECT 'Liczba typów formatek', COUNT(DISTINCT pf.id)::TEXT
    FROM zko.pozycje_formatki pf
    JOIN zko.pozycje p ON p.id = pf.pozycja_id
    WHERE p.zko_id = p_zko_id
    UNION ALL
    SELECT 'Łączna liczba sztuk', SUM(pf.ilosc_planowana)::TEXT
    FROM zko.pozycje_formatki pf
    JOIN zko.pozycje p ON p.id = pf.pozycja_id
    WHERE p.zko_id = p_zko_id
    UNION ALL
    SELECT 'Potrzebnych palet (max 200 szt/paleta)', 
           CEIL(SUM(pf.ilosc_planowana)::NUMERIC / 200)::TEXT
    FROM zko.pozycje_formatki pf
    JOIN zko.pozycje p ON p.id = pf.pozycja_id
    WHERE p.zko_id = p_zko_id
    UNION ALL
    SELECT 'Szczegóły formatek', ''
    UNION ALL
    SELECT 
        '  - ' || pf.nazwa_formatki,
        pf.ilosc_planowana || ' szt.'
    FROM zko.pozycje_formatki pf
    JOIN zko.pozycje p ON p.id = pf.pozycja_id
    WHERE p.zko_id = p_zko_id
    ORDER BY 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. PRZYKŁAD UŻYCIA
-- =====================================================

-- Test dla ZKO 27
-- SELECT * FROM zko.test_palety_v6(27);

-- Planowanie z nową funkcją
-- SELECT * FROM zko.pal_planuj_inteligentnie_v6(
--     27, 'inteligentna', 1440, 200, 700, 18, 'EURO', true, 'system', true
-- );

-- Podgląd palet z ilościami
-- SELECT * FROM zko.v_palety_szczegoly WHERE zko_id = 27;
