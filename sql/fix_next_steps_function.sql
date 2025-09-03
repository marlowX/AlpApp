-- Aktualizacja funkcji pobierz_nastepne_kroki_simple
-- Obsługa wszystkich statusów w systemie

CREATE OR REPLACE FUNCTION zko.pobierz_nastepne_kroki_simple(p_zko_id integer)
 RETURNS TABLE(kod_etapu character varying, nazwa_etapu character varying)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_status VARCHAR;
BEGIN
    -- Pobierz aktualny status (normalizuj do uppercase)
    SELECT UPPER(status) INTO v_status
    FROM zko.zlecenia
    WHERE id = p_zko_id;
    
    -- Zwróć następne możliwe kroki w zależności od statusu
    IF v_status = 'NOWE' THEN
        RETURN QUERY
        SELECT 'CIECIE'::VARCHAR, 'Rozpocznij cięcie'::VARCHAR
        UNION ALL
        SELECT 'BUFOR_PILA'::VARCHAR, 'Przekaż do bufora piły'::VARCHAR;
        
    -- Obsługa statusów CIECIE i bufora piły
    ELSIF v_status IN ('CIECIE', 'CIECIE_START', 'BUFOR_PILA', 'CIECIE_STOP') THEN
        RETURN QUERY
        SELECT 'OKLEJANIE'::VARCHAR, 'Rozpocznij oklejanie'::VARCHAR
        UNION ALL
        SELECT 'BUFOR_OKLEINIARKA'::VARCHAR, 'Przekaż do bufora okleiniarki'::VARCHAR
        UNION ALL
        SELECT 'MAGAZYN'::VARCHAR, 'Przekaż na magazyn'::VARCHAR;
        
    -- Obsługa statusów OKLEJANIE i bufora okleiniarki  
    ELSIF v_status IN ('OKLEJANIE', 'OKLEJANIE_START', 'BUFOR_OKLEINIARKA', 'OKLEJANIE_STOP') THEN
        RETURN QUERY
        SELECT 'WIERCENIE'::VARCHAR, 'Rozpocznij wiercenie'::VARCHAR
        UNION ALL
        SELECT 'BUFOR_WIERCENIE'::VARCHAR, 'Przekaż do bufora wiertarki'::VARCHAR
        UNION ALL
        SELECT 'MAGAZYN'::VARCHAR, 'Przekaż na magazyn'::VARCHAR;
        
    -- Obsługa statusów WIERCENIE i bufora wiertarki
    ELSIF v_status IN ('WIERCENIE', 'WIERCENIE_START', 'BUFOR_WIERCENIE', 'WIERCENIE_STOP') THEN
        RETURN QUERY
        SELECT 'PAKOWANIE'::VARCHAR, 'Rozpocznij pakowanie'::VARCHAR
        UNION ALL
        SELECT 'MAGAZYN'::VARCHAR, 'Przekaż na magazyn'::VARCHAR;
        
    -- Obsługa statusów PAKOWANIE
    ELSIF v_status IN ('PAKOWANIE', 'PAKOWANIE_START', 'PAKOWANIE_STOP', 'ZAMKNIECIE_PALETY') THEN
        RETURN QUERY
        SELECT 'TRANSPORT'::VARCHAR, 'Przygotuj do transportu'::VARCHAR
        UNION ALL
        SELECT 'WYSYLKA'::VARCHAR, 'Wyślij do klienta'::VARCHAR
        UNION ALL
        SELECT 'MAGAZYN'::VARCHAR, 'Przekaż na magazyn'::VARCHAR
        UNION ALL
        SELECT 'ZAKONCZONA'::VARCHAR, 'Zakończ zlecenie'::VARCHAR;
        
    -- Obsługa statusów TRANSPORT i WYSYŁKA
    ELSIF v_status IN ('TRANSPORT', 'TRANSPORT_1', 'WYSYLKA') THEN
        RETURN QUERY
        SELECT 'ZAKONCZONA'::VARCHAR, 'Potwierdź odbiór i zakończ'::VARCHAR;
        
    -- Obsługa MAGAZYN
    ELSIF v_status = 'MAGAZYN' THEN
        RETURN QUERY
        SELECT 'WYSYLKA'::VARCHAR, 'Wyślij z magazynu'::VARCHAR
        UNION ALL
        SELECT 'ZAKONCZONA'::VARCHAR, 'Zakończ zlecenie'::VARCHAR;
        
    -- Status ZAKONCZONA lub ZAKONCZONE - brak dalszych kroków
    ELSIF v_status IN ('ZAKONCZONA', 'ZAKONCZONE') THEN
        -- Brak dalszych kroków - zwracamy pustą tabelę
        RETURN;
        
    -- Nieznany status - pokaż podstawowe opcje
    ELSE
        RETURN QUERY
        SELECT 'MAGAZYN'::VARCHAR, 'Przekaż na magazyn'::VARCHAR
        UNION ALL
        SELECT 'ZAKONCZONA'::VARCHAR, 'Zakończ zlecenie'::VARCHAR;
    END IF;
END;
$function$;

-- Test dla ZKO-00040
SELECT * FROM zko.pobierz_nastepne_kroki_simple(
    (SELECT id FROM zko.zlecenia WHERE numer_zko = 'ZKO-00040')
);
