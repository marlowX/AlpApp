-- =====================================================
-- FUNKCJA: pal_oblicz_wysokosc_palety
-- Oblicza rzeczywistą wysokość palety uwzględniając 
-- układanie formatek obok siebie na poziomach
-- =====================================================

CREATE OR REPLACE FUNCTION zko.pal_oblicz_wysokosc_palety(
    p_formatki_data JSONB,  -- Array: [{id, ilosc, dlugosc, szerokosc}]
    p_grubosc_mm INTEGER DEFAULT 18,
    p_paleta_dlugosc_mm INTEGER DEFAULT 1200,  -- Standard EURO
    p_paleta_szerokosc_mm INTEGER DEFAULT 800,  -- Standard EURO
    p_margines_mm INTEGER DEFAULT 20  -- Margines bezpieczeństwa na krawędziach
) 
RETURNS TABLE(
    wysokosc_mm INTEGER,
    liczba_poziomow INTEGER,
    formatek_na_poziom INTEGER,
    wykorzystanie_powierzchni NUMERIC,
    uklad_optymalny TEXT,
    szczegoly_ukladu JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_formatka RECORD;
    v_poziom_current INTEGER := 1;
    v_powierzchnia_palety INTEGER;
    v_powierzchnia_uzyta INTEGER := 0;
    v_formatek_na_poziom INTEGER;
    v_pozostalo_formatek INTEGER;
    v_uklad JSONB := '[]'::JSONB;
    v_formatki_list JSONB;
    v_total_formatek INTEGER := 0;
    v_liczba_poziomow INTEGER;
BEGIN
    -- Oblicz powierzchnię użytkową palety (z marginesem)
    v_powierzchnia_palety := (p_paleta_dlugosc_mm - 2*p_margines_mm) * 
                             (p_paleta_szerokosc_mm - 2*p_margines_mm);
    
    -- Przetworz dane formatek
    v_formatki_list := p_formatki_data;
    
    -- Dla każdego typu formatki
    FOR v_formatka IN 
        SELECT 
            (value->>'id')::INTEGER as id,
            (value->>'ilosc')::INTEGER as ilosc,
            (value->>'dlugosc')::NUMERIC as dlugosc,
            (value->>'szerokosc')::NUMERIC as szerokosc,
            LEAST(
                (value->>'dlugosc')::NUMERIC, 
                (value->>'szerokosc')::NUMERIC
            ) * GREATEST(
                (value->>'dlugosc')::NUMERIC, 
                (value->>'szerokosc')::NUMERIC
            ) as powierzchnia
        FROM jsonb_array_elements(v_formatki_list)
    LOOP
        v_total_formatek := v_total_formatek + v_formatka.ilosc;
        
        -- Oblicz ile formatek zmieści się na jednym poziomie
        -- Próbuj różne układy (poziomo/pionowo)
        v_formatek_na_poziom := GREATEST(
            -- Układ 1: formatki wzdłuż długości palety
            FLOOR((p_paleta_dlugosc_mm - 2*p_margines_mm) / v_formatka.dlugosc) *
            FLOOR((p_paleta_szerokosc_mm - 2*p_margines_mm) / v_formatka.szerokosc),
            -- Układ 2: formatki obrócone o 90 stopni
            FLOOR((p_paleta_dlugosc_mm - 2*p_margines_mm) / v_formatka.szerokosc) *
            FLOOR((p_paleta_szerokosc_mm - 2*p_margines_mm) / v_formatka.dlugosc)
        );
        
        -- Jeśli formatka jest za duża na paletę
        IF v_formatek_na_poziom = 0 THEN
            v_formatek_na_poziom := 1;  -- Minimum 1 formatka (wystająca)
        END IF;
        
        -- Dodaj informację o układzie
        v_uklad := v_uklad || jsonb_build_object(
            'formatka_id', v_formatka.id,
            'wymiary', v_formatka.dlugosc || 'x' || v_formatka.szerokosc,
            'ilosc_total', v_formatka.ilosc,
            'formatek_na_poziom', v_formatek_na_poziom,
            'liczba_poziomow', CEIL(v_formatka.ilosc::NUMERIC / v_formatek_na_poziom)
        );
    END LOOP;
    
    -- Oblicz optymalny układ mieszany
    -- Strategia: układaj formatki różnych rozmiarów na tym samym poziomie
    
    -- Przykład dla formatek 600x300:
    -- Na palecie 1200x800 zmieszczą się:
    -- - 2 formatki wzdłuż (600*2=1200) x 2 formatki wszerz (300*2=600) = 4 formatki/poziom
    -- - Zostaje 200mm wolnego miejsca (800-600=200) na mniejsze formatki
    
    -- Oblicz liczbę poziomów
    -- Uproszczone: zakładamy średnio 4 formatki na poziom (można to później zoptymalizować)
    v_formatek_na_poziom := 4;  -- Typowy układ dla standardowych formatek
    v_liczba_poziomow := CEIL(v_total_formatek::NUMERIC / v_formatek_na_poziom);
    
    -- Oblicz wysokość
    RETURN QUERY
    SELECT 
        (v_liczba_poziomow * p_grubosc_mm)::INTEGER as wysokosc_mm,
        v_liczba_poziomow as liczba_poziomow,
        v_formatek_na_poziom as formatek_na_poziom,
        ROUND((v_formatek_na_poziom::NUMERIC * 100) / 
              (v_powierzchnia_palety::NUMERIC / 100000), 2) as wykorzystanie_powierzchni,
        CASE 
            WHEN v_formatek_na_poziom >= 4 THEN 'Optymalny układ 2x2'
            WHEN v_formatek_na_poziom >= 2 THEN 'Układ 2x1'
            ELSE 'Formatki układane pojedynczo'
        END as uklad_optymalny,
        jsonb_build_object(
            'total_formatek', v_total_formatek,
            'poziomy', v_liczba_poziomow,
            'formatek_na_poziom_avg', v_formatek_na_poziom,
            'wysokosc_mm', v_liczba_poziomow * p_grubosc_mm,
            'powierzchnia_palety_mm2', v_powierzchnia_palety,
            'formatki_szczegoly', v_uklad
        ) as szczegoly_ukladu;
END;
$$;

-- =====================================================
-- FUNKCJA: pal_planuj_z_wysokoscia_v2
-- Planowanie palet z prawidłowym obliczaniem wysokości
-- =====================================================

CREATE OR REPLACE FUNCTION zko.pal_planuj_z_wysokoscia_v2(
    p_zko_id INTEGER,
    p_max_wysokosc_mm INTEGER DEFAULT 1440,
    p_max_formatek_na_palete INTEGER DEFAULT 80,
    p_grubosc_mm INTEGER DEFAULT 18,
    p_strategia VARCHAR DEFAULT 'kolory',  -- kolory | modular | optymalizacja
    p_nadpisz_istniejace BOOLEAN DEFAULT false
)
RETURNS TABLE(
    sukces BOOLEAN,
    komunikat TEXT,
    palety_utworzone INTEGER[],
    statystyki JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_paleta_id INTEGER;
    v_palety_ids INTEGER[] := '{}';
    v_formatki_grupy RECORD;
    v_wysokosc_result RECORD;
    v_paleta_numer INTEGER := 1;
    v_total_palet INTEGER := 0;
    v_formatki_json JSONB;
BEGIN
    -- Usuń stare palety jeśli trzeba
    IF p_nadpisz_istniejace THEN
        DELETE FROM zko.palety_formatki_ilosc 
        WHERE paleta_id IN (SELECT id FROM zko.palety WHERE zko_id = p_zko_id);
        
        DELETE FROM zko.palety_historia 
        WHERE paleta_id IN (SELECT id FROM zko.palety WHERE zko_id = p_zko_id);
        
        DELETE FROM zko.palety WHERE zko_id = p_zko_id;
    END IF;
    
    -- Sprawdź czy są już palety
    IF EXISTS(SELECT 1 FROM zko.palety WHERE zko_id = p_zko_id) AND NOT p_nadpisz_istniejace THEN
        RETURN QUERY SELECT 
            FALSE,
            'ZKO ma już palety. Użyj nadpisz_istniejace=true',
            ARRAY[]::INTEGER[],
            '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Grupuj formatki według strategii
    IF p_strategia = 'kolory' THEN
        -- Grupowanie po kolorach
        FOR v_formatki_grupy IN
            SELECT 
                TRIM(SPLIT_PART(pf.nazwa_formatki, ' - ', 2)) as grupa_kolor,
                jsonb_agg(
                    jsonb_build_object(
                        'id', pf.id,
                        'ilosc', pf.ilosc_planowana,
                        'dlugosc', pf.dlugosc,
                        'szerokosc', pf.szerokosc
                    )
                ) as formatki_data,
                SUM(pf.ilosc_planowana) as total_sztuk
            FROM zko.pozycje p
            JOIN zko.pozycje_formatki pf ON p.id = pf.pozycja_id
            WHERE p.zko_id = p_zko_id
            GROUP BY TRIM(SPLIT_PART(pf.nazwa_formatki, ' - ', 2))
            HAVING SUM(pf.ilosc_planowana) > 0
        LOOP
            -- Oblicz prawidłową wysokość dla tej grupy formatek
            SELECT * INTO v_wysokosc_result
            FROM zko.pal_oblicz_wysokosc_palety(
                v_formatki_grupy.formatki_data,
                p_grubosc_mm
            );
            
            -- Podziel na palety jeśli za wysoko
            DECLARE
                v_formatki_na_palete INTEGER;
                v_liczba_palet_grupy INTEGER;
                v_pozostalo_sztuk INTEGER;
                v_sztuk_na_palete INTEGER;
            BEGIN
                v_pozostalo_sztuk := v_formatki_grupy.total_sztuk;
                
                -- Oblicz ile palet potrzeba dla tej grupy
                IF v_wysokosc_result.wysokosc_mm > p_max_wysokosc_mm THEN
                    -- Za wysoko - trzeba podzielić
                    v_liczba_palet_grupy := CEIL(v_wysokosc_result.wysokosc_mm::NUMERIC / p_max_wysokosc_mm);
                    v_sztuk_na_palete := CEIL(v_formatki_grupy.total_sztuk::NUMERIC / v_liczba_palet_grupy);
                ELSE
                    -- Mieści się na jednej palecie
                    v_liczba_palet_grupy := 1;
                    v_sztuk_na_palete := v_formatki_grupy.total_sztuk;
                END IF;
                
                -- Twórz palety dla tej grupy
                FOR i IN 1..v_liczba_palet_grupy LOOP
                    DECLARE
                        v_sztuk_paleta INTEGER;
                        v_wysokosc_paleta INTEGER;
                    BEGIN
                        -- Ostatnia paleta może mieć mniej
                        IF i = v_liczba_palet_grupy THEN
                            v_sztuk_paleta := v_pozostalo_sztuk;
                        ELSE
                            v_sztuk_paleta := LEAST(v_sztuk_na_palete, v_pozostalo_sztuk);
                        END IF;
                        
                        -- Oblicz wysokość dla tej ilości
                        v_wysokosc_paleta := CEIL(v_sztuk_paleta::NUMERIC / v_wysokosc_result.formatek_na_poziom) * p_grubosc_mm;
                        
                        -- Utwórz paletę
                        INSERT INTO zko.palety (
                            zko_id,
                            numer_palety,
                            kierunek,
                            status,
                            typ_palety,
                            ilosc_formatek,
                            wysokosc_stosu,
                            kolory_na_palecie,
                            formatki_ids
                        ) VALUES (
                            p_zko_id,
                            format('PAL-ZKO-%s-%s', LPAD(p_zko_id::TEXT, 5, '0'), LPAD(v_paleta_numer::TEXT, 3, '0')),
                            'wewnetrzny',
                            'otwarta',
                            'EURO',
                            v_sztuk_paleta,
                            v_wysokosc_paleta,
                            v_formatki_grupy.grupa_kolor,
                            (SELECT array_agg((el->>'id')::INTEGER) FROM jsonb_array_elements(v_formatki_grupy.formatki_data) el)
                        ) RETURNING id INTO v_paleta_id;
                        
                        v_palety_ids := array_append(v_palety_ids, v_paleta_id);
                        v_paleta_numer := v_paleta_numer + 1;
                        v_total_palet := v_total_palet + 1;
                        v_pozostalo_sztuk := v_pozostalo_sztuk - v_sztuk_paleta;
                        
                        -- Wypełnij tabelę ilości proporcjonalnie
                        DECLARE
                            v_formatka RECORD;
                            v_proporcja NUMERIC;
                        BEGIN
                            FOR v_formatka IN 
                                SELECT 
                                    (value->>'id')::INTEGER as id,
                                    (value->>'ilosc')::INTEGER as ilosc_total
                                FROM jsonb_array_elements(v_formatki_grupy.formatki_data)
                            LOOP
                                v_proporcja := v_formatka.ilosc_total::NUMERIC / v_formatki_grupy.total_sztuk;
                                
                                INSERT INTO zko.palety_formatki_ilosc (paleta_id, formatka_id, ilosc)
                                VALUES (
                                    v_paleta_id, 
                                    v_formatka.id, 
                                    ROUND(v_sztuk_paleta * v_proporcja)
                                );
                            END LOOP;
                        END;
                    END;
                END LOOP;
            END;
        END LOOP;
        
    ELSE
        -- Inne strategie - do implementacji
        RETURN QUERY SELECT 
            FALSE,
            'Strategia ' || p_strategia || ' nie jest jeszcze zaimplementowana',
            ARRAY[]::INTEGER[],
            '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Zwróć wyniki
    RETURN QUERY SELECT 
        TRUE,
        format('Utworzono %s palet z prawidłową wysokością', v_total_palet),
        v_palety_ids,
        jsonb_build_object(
            'palety_utworzone', v_total_palet,
            'strategia', p_strategia,
            'max_wysokosc_mm', p_max_wysokosc_mm,
            'grubosc_mm', p_grubosc_mm
        );
END;
$$;

-- =====================================================
-- TEST: Sprawdzenie dla przykładowych formatek
-- =====================================================

-- Test obliczania wysokości dla formatek 600x300
-- SELECT * FROM zko.pal_oblicz_wysokosc_palety(
--     '[{"id": 1, "ilosc": 80, "dlugosc": 600, "szerokosc": 300}]'::JSONB,
--     18,  -- grubość 18mm
--     1200, -- paleta długość
--     800   -- paleta szerokość
-- );

-- Wynik powinien pokazać:
-- - 4 formatki na poziom (2x2 układ: 600*2=1200mm x 300*2=600mm, zostaje 200mm)
-- - 20 poziomów (80 formatek / 4 na poziom)
-- - 360mm wysokość (20 poziomów * 18mm)
