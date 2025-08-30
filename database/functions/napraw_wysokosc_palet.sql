-- =====================================================
-- FUNKCJA: napraw_wysokosc_palet
-- Naprawia wysokości istniejących palet
-- uwzględniając układanie formatek obok siebie
-- =====================================================

CREATE OR REPLACE FUNCTION zko.napraw_wysokosc_palet(p_zko_id INTEGER)
RETURNS TABLE(
    paleta_id INTEGER,
    numer_palety TEXT,
    stara_wysokosc NUMERIC,
    nowa_wysokosc NUMERIC,
    formatek_na_poziom INTEGER,
    liczba_poziomow INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_paleta RECORD;
    v_formatka RECORD;
    v_formatek_na_poziom INTEGER;
    v_liczba_poziomow INTEGER;
    v_nowa_wysokosc NUMERIC;
BEGIN
    FOR v_paleta IN 
        SELECT p.id, p.numer_palety, p.wysokosc_stosu, p.ilosc_formatek
        FROM zko.palety p
        WHERE p.zko_id = p_zko_id
    LOOP
        -- Domyślne wartości
        v_formatek_na_poziom := 4; -- Średnia dla standardowych formatek
        v_liczba_poziomow := CEIL(v_paleta.ilosc_formatek::NUMERIC / v_formatek_na_poziom);
        v_nowa_wysokosc := v_liczba_poziomow * 18;
        
        -- Sprawdź czy mamy szczegóły formatek
        SELECT INTO v_formatka
            AVG(GREATEST(
                FLOOR(1200 / pf.dlugosc) * FLOOR(800 / pf.szerokosc),
                FLOOR(1200 / pf.szerokosc) * FLOOR(800 / pf.dlugosc)
            ))::INTEGER as avg_na_poziom
        FROM zko.palety_formatki_ilosc pfi
        JOIN zko.pozycje_formatki pf ON pf.id = pfi.formatka_id
        WHERE pfi.paleta_id = v_paleta.id;
        
        IF v_formatka.avg_na_poziom IS NOT NULL AND v_formatka.avg_na_poziom > 0 THEN
            v_formatek_na_poziom := v_formatka.avg_na_poziom;
            v_liczba_poziomow := CEIL(v_paleta.ilosc_formatek::NUMERIC / v_formatek_na_poziom);
            v_nowa_wysokosc := v_liczba_poziomow * 18;
        END IF;
        
        -- Aktualizuj wysokość palety
        UPDATE zko.palety 
        SET wysokosc_stosu = v_nowa_wysokosc
        WHERE id = v_paleta.id;
        
        RETURN QUERY SELECT 
            v_paleta.id::INTEGER,
            v_paleta.numer_palety::TEXT,
            v_paleta.wysokosc_stosu::NUMERIC,
            v_nowa_wysokosc::NUMERIC,
            v_formatek_na_poziom::INTEGER,
            v_liczba_poziomow::INTEGER;
    END LOOP;
END;
$$;

-- =====================================================
-- PRZYKŁAD UŻYCIA:
-- SELECT * FROM zko.napraw_wysokosc_palet(28);
-- =====================================================
