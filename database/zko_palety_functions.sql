-- Funkcje zarządzania paletami w ZKO
-- Schema: zko

-- 1. Funkcja do inteligentnego planowania palet
DROP FUNCTION IF EXISTS zko.pal_planuj_inteligentnie_v4;
CREATE OR REPLACE FUNCTION zko.pal_planuj_inteligentnie_v4(
    p_zko_id INTEGER,
    p_max_wysokosc_mm NUMERIC DEFAULT 1440,
    p_max_formatek_na_palete INTEGER DEFAULT 200,
    p_grubosc_plyty NUMERIC DEFAULT 18
)
RETURNS TABLE(
    paleta_nr INTEGER,
    formatki JSONB,
    ilosc_formatek INTEGER,
    wysokosc_stosu NUMERIC,
    kierunek VARCHAR,
    kolor VARCHAR
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_formatka RECORD;
    v_paleta_nr INTEGER := 1;
    v_current_wysokosc NUMERIC := 0;
    v_current_formatki JSONB := '[]'::jsonb;
    v_current_ilosc INTEGER := 0;
    v_current_kolor VARCHAR;
BEGIN
    -- Pobierz formatki posortowane po kolorze i rozmiarze
    FOR v_formatka IN 
        SELECT 
            pf.id,
            pf.nazwa_formatki,
            pf.dlugosc,
            pf.szerokosc,
            pf.ilosc_planowana,
            p.kolor_plyty,
            CASE 
                WHEN pf.dlugosc > pf.szerokosc THEN 'wzdłuż'
                ELSE 'wszerz'
            END as kierunek_formatki
        FROM zko.pozycje_formatki pf
        JOIN zko.pozycje p ON pf.pozycja_id = p.id
        WHERE p.zko_id = p_zko_id
        ORDER BY p.kolor_plyty, pf.dlugosc DESC, pf.szerokosc DESC
    LOOP
        -- Sprawdź czy trzeba utworzyć nową paletę
        IF v_current_kolor IS DISTINCT FROM v_formatka.kolor_plyty OR
           v_current_wysokosc + (v_formatka.ilosc_planowana * p_grubosc_plyty) > p_max_wysokosc_mm OR
           v_current_ilosc + v_formatka.ilosc_planowana > p_max_formatek_na_palete 
        THEN
            -- Zwróć obecną paletę jeśli nie jest pusta
            IF v_current_ilosc > 0 THEN
                RETURN QUERY SELECT 
                    v_paleta_nr,
                    v_current_formatki,
                    v_current_ilosc,
                    v_current_wysokosc,
                    v_formatka.kierunek_formatki,
                    v_current_kolor;
                
                v_paleta_nr := v_paleta_nr + 1;
                v_current_formatki := '[]'::jsonb;
                v_current_wysokosc := 0;
                v_current_ilosc := 0;
            END IF;
            
            v_current_kolor := v_formatka.kolor_plyty;
        END IF;
        
        -- Dodaj formatki do palety
        v_current_formatki := v_current_formatki || jsonb_build_object(
            'formatka_id', v_formatka.id,
            'nazwa', v_formatka.nazwa_formatki,
            'dlugosc', v_formatka.dlugosc,
            'szerokosc', v_formatka.szerokosc,
            'ilosc', v_formatka.ilosc_planowana,
            'kolor', v_formatka.kolor_plyty
        );
        
        v_current_wysokosc := v_current_wysokosc + (v_formatka.ilosc_planowana * p_grubosc_plyty);
        v_current_ilosc := v_current_ilosc + v_formatka.ilosc_planowana;
    END LOOP;
    
    -- Zwróć ostatnią paletę
    IF v_current_ilosc > 0 THEN
        RETURN QUERY SELECT 
            v_paleta_nr,
            v_current_formatki,
            v_current_ilosc,
            v_current_wysokosc,
            'wzdłuż'::varchar,
            v_current_kolor;
    END IF;
END;
$$;

-- 2. Funkcja do tworzenia palet na podstawie planu
DROP FUNCTION IF EXISTS zko.pal_utworz_palety;
CREATE OR REPLACE FUNCTION zko.pal_utworz_palety(
    p_zko_id INTEGER,
    p_operator VARCHAR DEFAULT 'system'
)
RETURNS TABLE(
    sukces BOOLEAN,
    komunikat TEXT,
    palety_utworzone INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_plan RECORD;
    v_paleta_id INTEGER;
    v_palety_count INTEGER := 0;
BEGIN
    -- Usuń istniejące palety jeśli są
    DELETE FROM zko.palety WHERE zko_id = p_zko_id;
    
    -- Utwórz palety zgodnie z planem
    FOR v_plan IN 
        SELECT * FROM zko.pal_planuj_inteligentnie_v4(p_zko_id)
    LOOP
        INSERT INTO zko.palety (
            zko_id,
            numer_palety,
            kierunek,
            kolory_na_palecie,
            ilosc_formatek,
            wysokosc_stosu,
            status,
            operator_pakujacy
        ) VALUES (
            p_zko_id,
            'PAL-' || p_zko_id || '-' || LPAD(v_plan.paleta_nr::text, 3, '0'),
            v_plan.kierunek,
            v_plan.kolor,
            v_plan.ilosc_formatek,
            v_plan.wysokosc_stosu,
            'przygotowanie',
            p_operator
        ) RETURNING id INTO v_paleta_id;
        
        -- Zapisz które formatki są na palecie
        UPDATE zko.palety 
        SET formatki_ids = ARRAY(
            SELECT (jsonb_array_elements(v_plan.formatki)->>'formatka_id')::int
        )
        WHERE id = v_paleta_id;
        
        v_palety_count := v_palety_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT 
        TRUE,
        'Utworzono ' || v_palety_count || ' palet dla ZKO #' || p_zko_id,
        v_palety_count;
END;
$$;

-- 3. Funkcja do przenoszenia formatek między paletami
DROP FUNCTION IF EXISTS zko.pal_przenies_formatki;
CREATE OR REPLACE FUNCTION zko.pal_przenies_formatki(
    p_formatka_id INTEGER,
    p_z_palety_id INTEGER,
    p_na_palete_id INTEGER,
    p_ilosc INTEGER DEFAULT NULL
)
RETURNS TABLE(
    sukces BOOLEAN,
    komunikat TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_formatka RECORD;
    v_z_palety RECORD;
    v_na_palete RECORD;
    v_ilosc_do_przeniesienia INTEGER;
BEGIN
    -- Pobierz dane formatki
    SELECT * INTO v_formatka 
    FROM zko.pozycje_formatki 
    WHERE id = p_formatka_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Nie znaleziono formatki';
        RETURN;
    END IF;
    
    -- Pobierz dane palet
    SELECT * INTO v_z_palety FROM zko.palety WHERE id = p_z_palety_id;
    SELECT * INTO v_na_palete FROM zko.palety WHERE id = p_na_palete_id;
    
    IF v_z_palety.id IS NULL OR v_na_palete.id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Nie znaleziono palety';
        RETURN;
    END IF;
    
    -- Określ ilość do przeniesienia
    v_ilosc_do_przeniesienia := COALESCE(p_ilosc, v_formatka.ilosc_planowana);
    
    -- Usuń z pierwszej palety
    UPDATE zko.palety 
    SET formatki_ids = array_remove(formatki_ids, p_formatka_id),
        ilosc_formatek = ilosc_formatek - v_ilosc_do_przeniesienia
    WHERE id = p_z_palety_id;
    
    -- Dodaj do drugiej palety
    UPDATE zko.palety 
    SET formatki_ids = array_append(formatki_ids, p_formatka_id),
        ilosc_formatek = ilosc_formatek + v_ilosc_do_przeniesienia
    WHERE id = p_na_palete_id;
    
    RETURN QUERY SELECT 
        TRUE, 
        'Przeniesiono ' || v_ilosc_do_przeniesienia || ' formatek';
END;
$$;

-- 4. Funkcja do zmiany ilości palet
DROP FUNCTION IF EXISTS zko.pal_zmien_ilosc_palet;
CREATE OR REPLACE FUNCTION zko.pal_zmien_ilosc_palet(
    p_zko_id INTEGER,
    p_nowa_ilosc INTEGER
)
RETURNS TABLE(
    sukces BOOLEAN,
    komunikat TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_obecna_ilosc INTEGER;
    v_paleta_id INTEGER;
    v_i INTEGER;
BEGIN
    -- Pobierz obecną ilość palet
    SELECT COUNT(*) INTO v_obecna_ilosc
    FROM zko.palety
    WHERE zko_id = p_zko_id;
    
    IF p_nowa_ilosc = v_obecna_ilosc THEN
        RETURN QUERY SELECT TRUE, 'Ilość palet bez zmian';
        RETURN;
    END IF;
    
    IF p_nowa_ilosc < v_obecna_ilosc THEN
        -- Usuń nadmiarowe palety
        DELETE FROM zko.palety
        WHERE zko_id = p_zko_id
        AND id IN (
            SELECT id FROM zko.palety 
            WHERE zko_id = p_zko_id 
            ORDER BY id DESC 
            LIMIT (v_obecna_ilosc - p_nowa_ilosc)
        );
    ELSE
        -- Dodaj brakujące palety
        FOR v_i IN 1..(p_nowa_ilosc - v_obecna_ilosc) LOOP
            INSERT INTO zko.palety (
                zko_id,
                numer_palety,
                kierunek,
                status
            ) VALUES (
                p_zko_id,
                'PAL-' || p_zko_id || '-' || LPAD((v_obecna_ilosc + v_i)::text, 3, '0'),
                'wzdłuż',
                'przygotowanie'
            );
        END LOOP;
    END IF;
    
    RETURN QUERY SELECT 
        TRUE, 
        'Zmieniono ilość palet z ' || v_obecna_ilosc || ' na ' || p_nowa_ilosc;
END;
$$;

-- 5. Widok podsumowania palet
CREATE OR REPLACE VIEW zko.v_palety_podsumowanie AS
SELECT 
    p.id as paleta_id,
    p.zko_id,
    p.numer_palety,
    p.kierunek,
    p.status,
    p.ilosc_formatek,
    p.wysokosc_stosu,
    p.kolory_na_palecie,
    z.numer_zko,
    z.kooperant,
    COUNT(DISTINCT poz.id) as liczba_pozycji,
    STRING_AGG(DISTINCT poz.kolor_plyty, ', ') as wszystkie_kolory
FROM zko.palety p
JOIN zko.zlecenia z ON p.zko_id = z.id
LEFT JOIN zko.pozycje poz ON poz.zko_id = z.id
GROUP BY p.id, p.zko_id, p.numer_palety, p.kierunek, p.status, 
         p.ilosc_formatek, p.wysokosc_stosu, p.kolory_na_palecie,
         z.numer_zko, z.kooperant;

COMMENT ON FUNCTION zko.pal_planuj_inteligentnie_v4 IS 'Inteligentne planowanie rozmieszczenia formatek na paletach';
COMMENT ON FUNCTION zko.pal_utworz_palety IS 'Tworzenie palet na podstawie planu';
COMMENT ON FUNCTION zko.pal_przenies_formatki IS 'Przenoszenie formatek między paletami';
COMMENT ON FUNCTION zko.pal_zmien_ilosc_palet IS 'Zmiana ilości palet dla ZKO';
COMMENT ON VIEW zko.v_palety_podsumowanie IS 'Widok podsumowania palet z danymi ZKO';
