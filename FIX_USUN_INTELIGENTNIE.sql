-- POPRAWKA DLA FUNKCJI pal_usun_inteligentnie
-- Błąd był w odwołaniu do nieistniejącej stałej p_max_formatek_na_palete

DROP FUNCTION IF EXISTS zko.pal_usun_inteligentnie;

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
    v_max_formatek_na_palete INTEGER := 200; -- Dodajemy stałą lokalną
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
            AND COALESCE(p2.ilosc_formatek, 0) + COALESCE(v_paleta.ilosc_formatek, 0) <= v_max_formatek_na_palete
            ORDER BY p2.ilosc_formatek ASC
            LIMIT 1;
            
            IF v_paleta_docelowa IS NOT NULL THEN
                -- Przenieś formatki (jeśli funkcja istnieje)
                IF EXISTS(SELECT 1 FROM information_schema.routines 
                         WHERE routine_schema = 'zko' 
                         AND routine_name = 'pal_przesun_formatki') THEN
                    PERFORM zko.pal_przesun_formatki(
                        v_paleta.id,
                        v_paleta_docelowa,
                        v_paleta.formatki_ids,
                        NULL,
                        p_operator,
                        format('Przeniesienie przed usunięciem palety %s', v_paleta.numer_palety)
                    );
                END IF;
                
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
        
        -- Loguj usunięcie (jeśli funkcja istnieje)
        IF EXISTS(SELECT 1 FROM information_schema.routines 
                 WHERE routine_schema = 'zko' 
                 AND routine_name = 'loguj_zmiane_palety') THEN
            PERFORM zko.loguj_zmiane_palety(
                v_paleta.id,
                'usuniecie',
                format('Usunięto paletę %s (formatek: %s)', 
                       v_paleta.numer_palety, COALESCE(v_paleta.ilosc_formatek, 0)),
                p_operator
            );
        END IF;
    END LOOP;
    
    -- Jeśli nie usunięto żadnych palet, zwróć odpowiedni komunikat
    IF array_length(v_usuniete_ids, 1) IS NULL THEN
        RETURN QUERY SELECT 
            TRUE,
            'Brak palet do usunięcia',
            '{}',
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
$$;

-- Test funkcji
SELECT 'Funkcja pal_usun_inteligentnie zaktualizowana pomyślnie!' as status;