-- NOWA FUNKCJA: Planowanie z grupowaniem po kolorach
-- Plik: database/functions/palety_grupowanie_kolory.sql

CREATE OR REPLACE FUNCTION zko.pal_planuj_z_kolorami(
    p_zko_id INTEGER,
    p_max_wysokosc_mm INTEGER DEFAULT 1440,
    p_max_formatek_na_palete INTEGER DEFAULT 80,
    p_nadpisz_istniejace BOOLEAN DEFAULT FALSE
) 
RETURNS TABLE (
    sukces BOOLEAN,
    komunikat TEXT,
    palety_utworzone INTEGER[],
    statystyki JSONB
) 
LANGUAGE plpgsql AS $$
DECLARE
    v_kolor RECORD;
    v_formatka RECORD;
    v_palety_ids INTEGER[] := '{}';
    v_paleta_id INTEGER;
    v_paleta_numer INTEGER := 1;
    v_istniejace INTEGER;
    v_total_formatek INTEGER := 0;
    v_total_palet INTEGER := 0;
    v_kolory_info JSONB := '[]'::JSONB;
    v_current_paleta_formatki INTEGER := 0;
    v_current_paleta_wysokosc NUMERIC := 0;
    v_current_paleta_waga NUMERIC := 0;
    v_formatki_na_palecie INTEGER[] := '{}';
    v_ilosci_na_palecie INTEGER[] := '{}';
    v_kolor_info JSONB;
BEGIN
    -- Sprawdź czy ZKO istnieje
    IF NOT EXISTS(SELECT 1 FROM zko.zlecenia WHERE id = p_zko_id) THEN
        RETURN QUERY SELECT 
            FALSE,
            'ZKO nie istnieje'::TEXT,
            ARRAY[]::INTEGER[],
            '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Sprawdź istniejące palety
    SELECT COUNT(*) INTO v_istniejace FROM zko.palety WHERE zko_id = p_zko_id;
    
    IF v_istniejace > 0 AND NOT p_nadpisz_istniejace THEN
        RETURN QUERY SELECT 
            FALSE,
            format('ZKO ma już %s palet', v_istniejace)::TEXT,
            ARRAY[]::INTEGER[],
            jsonb_build_object('istniejace', v_istniejace);
        RETURN;
    END IF;
    
    -- Usuń stare palety jeśli trzeba
    IF p_nadpisz_istniejace AND v_istniejace > 0 THEN
        PERFORM zko.pal_helper_usun_palety(p_zko_id);
    END IF;
    
    -- Pobierz kolory i ich formatki, posortowane
    FOR v_kolor IN 
        SELECT 
            p.kolor_plyty,
            COUNT(DISTINCT pf.id) as typy_formatek,
            SUM(pf.ilosc_planowana) as total_sztuk
        FROM zko.pozycje p
        JOIN zko.pozycje_formatki pf ON p.id = pf.pozycja_id
        WHERE p.zko_id = p_zko_id
        GROUP BY p.kolor_plyty
        ORDER BY p.kolor_plyty
    LOOP
        -- Utwórz nową paletę dla tego koloru
        v_current_paleta_formatki := 0;
        v_current_paleta_wysokosc := 0;
        v_current_paleta_waga := 0;
        v_formatki_na_palecie := '{}';
        v_ilosci_na_palecie := '{}';
        
        -- Dodaj formatki tego koloru do palety
        FOR v_formatka IN
            SELECT 
                pf.id,
                pf.nazwa_formatki,
                pf.ilosc_planowana,
                pf.dlugosc,
                pf.szerokosc,
                18 as grubosc  -- domyślna grubość
            FROM zko.pozycje p
            JOIN zko.pozycje_formatki pf ON p.id = pf.pozycja_id
            WHERE p.zko_id = p_zko_id 
            AND p.kolor_plyty = v_kolor.kolor_plyty
            ORDER BY pf.ilosc_planowana DESC  -- Najwięcej sztuk najpierw
        LOOP
            -- Sprawdź czy formatka zmieści się na obecnej palecie
            IF v_current_paleta_formatki + v_formatka.ilosc_planowana <= p_max_formatek_na_palete 
               AND v_current_paleta_wysokosc + (v_formatka.ilosc_planowana * v_formatka.grubosc) <= p_max_wysokosc_mm THEN
                
                -- Dodaj formatki do obecnej palety
                v_current_paleta_formatki := v_current_paleta_formatki + v_formatka.ilosc_planowana;
                v_current_paleta_wysokosc := v_current_paleta_wysokosc + (v_formatka.ilosc_planowana * v_formatka.grubosc);
                v_current_paleta_waga := v_current_paleta_waga + (v_formatka.ilosc_planowana * 0.7); -- szacunkowa waga
                
                v_formatki_na_palecie := array_append(v_formatki_na_palecie, v_formatka.id);
                v_ilosci_na_palecie := array_append(v_ilosci_na_palecie, v_formatka.ilosc_planowana);
                
            ELSE
                -- Stwórz nową paletę jeśli obecna jest pełna
                IF v_current_paleta_formatki > 0 THEN
                    -- Zapisz obecną paletę
                    INSERT INTO zko.palety (
                        zko_id,
                        numer_palety,
                        kierunek,
                        status,
                        typ_palety,
                        formatki_ids,
                        ilosc_formatek,
                        wysokosc_stosu,
                        waga_kg,
                        kolory_na_palecie
                    ) VALUES (
                        p_zko_id,
                        format('PAL-ZKO-%s-%s', LPAD(p_zko_id::TEXT, 5, '0'), LPAD(v_paleta_numer::TEXT, 3, '0')),
                        'wewnetrzny',
                        'otwarta',
                        'EURO',
                        v_formatki_na_palecie,
                        v_current_paleta_formatki,
                        v_current_paleta_wysokosc,
                        v_current_paleta_waga,
                        v_kolor.kolor_plyty
                    ) RETURNING id INTO v_paleta_id;
                    
                    v_palety_ids := array_append(v_palety_ids, v_paleta_id);
                    v_paleta_numer := v_paleta_numer + 1;
                    v_total_palet := v_total_palet + 1;
                    
                    -- Zapisz ilości do tabeli palety_formatki_ilosc
                    FOR i IN 1..array_length(v_formatki_na_palecie, 1) LOOP
                        INSERT INTO zko.palety_formatki_ilosc (paleta_id, formatka_id, ilosc)
                        VALUES (v_paleta_id, v_formatki_na_palecie[i], v_ilosci_na_palecie[i]);
                    END LOOP;
                END IF;
                
                -- Rozpocznij nową paletę z obecną formatką
                v_current_paleta_formatki := v_formatka.ilosc_planowana;
                v_current_paleta_wysokosc := v_formatka.ilosc_planowana * v_formatka.grubosc;
                v_current_paleta_waga := v_formatka.ilosc_planowana * 0.7;
                v_formatki_na_palecie := ARRAY[v_formatka.id];
                v_ilosci_na_palecie := ARRAY[v_formatka.ilosc_planowana];
            END IF;
            
            v_total_formatek := v_total_formatek + v_formatka.ilosc_planowana;
        END LOOP;
        
        -- Zapisz ostatnią paletę dla tego koloru
        IF v_current_paleta_formatki > 0 THEN
            INSERT INTO zko.palety (
                zko_id,
                numer_palety,
                kierunek,
                status,
                typ_palety,
                formatki_ids,
                ilosc_formatek,
                wysokosc_stosu,
                waga_kg,
                kolory_na_palecie
            ) VALUES (
                p_zko_id,
                format('PAL-ZKO-%s-%s', LPAD(p_zko_id::TEXT, 5, '0'), LPAD(v_paleta_numer::TEXT, 3, '0')),
                'wewnetrzny',
                'otwarta',
                'EURO',
                v_formatki_na_palecie,
                v_current_paleta_formatki,
                v_current_paleta_wysokosc,
                v_current_paleta_waga,
                v_kolor.kolor_plyty
            ) RETURNING id INTO v_paleta_id;
            
            v_palety_ids := array_append(v_palety_ids, v_paleta_id);
            v_paleta_numer := v_paleta_numer + 1;
            v_total_palet := v_total_palet + 1;
            
            -- Zapisz ilości do tabeli palety_formatki_ilosc
            FOR i IN 1..array_length(v_formatki_na_palecie, 1) LOOP
                INSERT INTO zko.palety_formatki_ilosc (paleta_id, formatka_id, ilosc)
                VALUES (v_paleta_id, v_formatki_na_palecie[i], v_ilosci_na_palecie[i]);
            END LOOP;
        END IF;
        
        -- Dodaj info o kolorze do statystyk
        v_kolory_info := v_kolory_info || jsonb_build_object(
            'kolor', v_kolor.kolor_plyty,
            'typy_formatek', v_kolor.typy_formatek,
            'total_sztuk', v_kolor.total_sztuk
        );
        
    END LOOP;
    
    -- Zwróć wyniki
    RETURN QUERY SELECT 
        TRUE,
        format('Utworzono %s palet dla %s kolorów (%s sztuk)', 
               v_total_palet, 
               jsonb_array_length(v_kolory_info), 
               v_total_formatek)::TEXT,
        v_palety_ids,
        jsonb_build_object(
            'palety_utworzone', v_total_palet,
            'sztuk_total', v_total_formatek,
            'kolory_info', v_kolory_info,
            'strategia', 'grupowanie_po_kolorach',
            'max_wysokosc_mm', p_max_wysokosc_mm,
            'max_formatek_na_palete', p_max_formatek_na_palete
        );
END;
$$;