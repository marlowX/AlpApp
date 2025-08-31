-- Poprawka funkcji zko.pal_edytuj
-- Problem: funkcja używa nieprawidłowych nazw kolumn w tabeli palety_historia
-- Rozwiązanie: dostosowanie do rzeczywistej struktury tabeli

CREATE OR REPLACE FUNCTION zko.pal_edytuj(
    p_paleta_id integer, 
    p_formatki jsonb, 
    p_przeznaczenie text DEFAULT NULL::text, 
    p_uwagi text DEFAULT NULL::text, 
    p_operator text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    v_result JSONB;
    v_formatka JSONB;
    v_total_waga NUMERIC := 0;
    v_total_wysokosc NUMERIC := 0;
    v_total_sztuk INTEGER := 0;
    v_formatki_ids INTEGER[] := ARRAY[]::INTEGER[];
    v_zko_id INTEGER;
    v_formatka_info RECORD;
    v_paleta_info RECORD;
BEGIN
    -- Sprawdź czy paleta istnieje i pobierz jej dane
    SELECT * INTO v_paleta_info
    FROM zko.palety
    WHERE id = p_paleta_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'sukces', false,
            'komunikat', format('Paleta o ID %s nie istnieje', p_paleta_id)
        );
    END IF;
    
    v_zko_id := v_paleta_info.zko_id;
    
    -- Rozpocznij transakcję
    BEGIN
        -- 1. Usuń stare formatki z palety
        DELETE FROM zko.palety_formatki_ilosc 
        WHERE paleta_id = p_paleta_id;
        
        -- 2. Jeśli są nowe formatki, dodaj je
        IF p_formatki IS NOT NULL AND jsonb_array_length(p_formatki) > 0 THEN
            FOR v_formatka IN SELECT * FROM jsonb_array_elements(p_formatki)
            LOOP
                -- Pobierz dane formatki
                SELECT 
                    pf.waga_sztuka,
                    COALESCE(poz.grubosc_plyty, 18) as grubosc,
                    pf.id as formatka_id,
                    pf.nazwa_formatki,
                    poz.kolor_plyty
                INTO v_formatka_info
                FROM zko.pozycje_formatki pf
                LEFT JOIN zko.pozycje poz ON poz.id = pf.pozycja_id
                WHERE pf.id = (v_formatka->>'formatka_id')::INTEGER;
                
                IF FOUND AND (v_formatka->>'ilosc')::INTEGER > 0 THEN
                    -- Dodaj do tabeli palety_formatki_ilosc
                    INSERT INTO zko.palety_formatki_ilosc (paleta_id, formatka_id, ilosc)
                    VALUES (
                        p_paleta_id, 
                        (v_formatka->>'formatka_id')::INTEGER,
                        (v_formatka->>'ilosc')::INTEGER
                    );
                    
                    -- Aktualizuj statystyki
                    v_formatki_ids := array_append(v_formatki_ids, v_formatka_info.formatka_id);
                    v_total_sztuk := v_total_sztuk + (v_formatka->>'ilosc')::INTEGER;
                    v_total_waga := v_total_waga + (COALESCE(v_formatka_info.waga_sztuka, 0) * (v_formatka->>'ilosc')::INTEGER);
                    
                    -- Oblicz wysokość (zakładamy 4 sztuki na poziom)
                    v_total_wysokosc := GREATEST(
                        v_total_wysokosc,
                        CEIL((v_formatka->>'ilosc')::NUMERIC / 4) * v_formatka_info.grubosc
                    );
                    
                    RAISE NOTICE 'Dodano formatkę %: % szt., kolor: %', 
                        v_formatka_info.nazwa_formatki, 
                        (v_formatka->>'ilosc')::INTEGER,
                        v_formatka_info.kolor_plyty;
                END IF;
            END LOOP;
        END IF;
        
        -- 3. Zaktualizuj paletę
        UPDATE zko.palety
        SET 
            formatki_ids = v_formatki_ids,
            ilosc_formatek = v_total_sztuk,
            wysokosc_stosu = v_total_wysokosc,
            waga_kg = v_total_waga,
            przeznaczenie = COALESCE(p_przeznaczenie, przeznaczenie),
            uwagi = CASE 
                WHEN p_uwagi IS NOT NULL THEN p_uwagi
                ELSE uwagi
            END,
            updated_at = NOW()
        WHERE id = p_paleta_id;
        
        -- 4. Dodaj wpis do historii (POPRAWIONE NAZWY KOLUMN)
        INSERT INTO zko.palety_historia (
            paleta_id,
            zko_id,
            akcja,  -- zmienione z 'operacja' na 'akcja'
            operator,
            opis_zmiany,
            stan_po,  -- użyjemy stan_po zamiast szczegoly
            created_at
        ) VALUES (
            p_paleta_id,
            v_zko_id,
            'EDYCJA',
            COALESCE(p_operator, 'system'),
            format('Edycja palety - %s formatek', v_total_sztuk),
            jsonb_build_object(
                'formatki_count', v_total_sztuk,
                'waga_kg', v_total_waga,
                'wysokosc_mm', v_total_wysokosc,
                'przeznaczenie', COALESCE(p_przeznaczenie, v_paleta_info.przeznaczenie),
                'uwagi', p_uwagi
            ),
            NOW()
        );
        
        -- Zwróć sukces z danymi palety
        v_result := jsonb_build_object(
            'sukces', true,
            'komunikat', CASE 
                WHEN v_total_sztuk > 0 THEN 
                    format('Paleta %s zaktualizowana: %s szt. w %s typach', 
                        v_paleta_info.numer_palety,
                        v_total_sztuk, 
                        array_length(v_formatki_ids, 1))
                ELSE 
                    format('Paleta %s zaktualizowana (pusta)', v_paleta_info.numer_palety)
            END,
            'paleta_id', p_paleta_id,
            'numer_palety', v_paleta_info.numer_palety,
            'sztuk_total', v_total_sztuk,
            'typy_formatek', array_length(v_formatki_ids, 1),
            'waga_kg', v_total_waga,
            'wysokosc_mm', v_total_wysokosc,
            'przeznaczenie', COALESCE(p_przeznaczenie, v_paleta_info.przeznaczenie),
            'zko_id', v_zko_id
        );
        
        RETURN v_result;
        
    EXCEPTION WHEN OTHERS THEN
        -- W razie błędu cofnij zmiany
        RAISE NOTICE 'Błąd podczas edycji palety %: %', p_paleta_id, SQLERRM;
        RETURN jsonb_build_object(
            'sukces', false,
            'komunikat', format('Błąd podczas edycji palety %s', v_paleta_info.numer_palety),
            'error', SQLERRM,
            'detail', SQLERRM
        );
    END;
END;
$function$;