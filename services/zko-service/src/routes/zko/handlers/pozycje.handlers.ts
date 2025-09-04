import { Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../../index';
import { logger } from '../utils/logger';
import { handleError } from '../utils/error-handler';
import { z } from 'zod';

// Schematy walidacji
const AddPozycjaSchema = z.object({
  zko_id: z.number(),
  rozkroj_id: z.number(),
  kolory_plyty: z.array(z.object({
    plyta_id: z.number().optional(),
    kolor: z.string(),
    nazwa: z.string(),
    ilosc: z.number().positive(),
    stan_magazynowy: z.number().optional(),
    grubosc: z.union([z.number(), z.string()]).optional(),
  })),
  kolejnosc: z.number().optional().nullable(),
  uwagi: z.string().optional().nullable(),
  sciezka_produkcji: z.string().optional().nullable(),
});

/**
 * Handler dodawania pozycji do ZKO
 */
export const handleAddPozycja = async (req: Request, res: Response) => {
  try {
    logger.info('Adding pozycja:', req.body);
    
    // Walidacja danych
    const validationResult = AddPozycjaSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationResult.error.errors
      });
    }
    
    const data = validationResult.data;
    
    // Konwersja grubości na number
    const processedData = {
      ...data,
      kolory_plyty: data.kolory_plyty.map((kp: any) => ({
        ...kp,
        grubosc: kp.grubosc ? parseFloat(String(kp.grubosc)) : undefined
      }))
    };
    
    // Przygotuj dane dla funkcji PostgreSQL
    const koloryPlytyJson = JSON.stringify(processedData.kolory_plyty);
    
    logger.info('Calling PostgreSQL function zko.dodaj_pozycje_do_zko');
    
    // Wywołaj funkcję PostgreSQL z dodatkowym parametrem sciezka_produkcji
    const result = await db.query(`
      SELECT * FROM zko.dodaj_pozycje_do_zko($1, $2, $3::jsonb, $4, $5, $6)
    `, [
      data.zko_id,
      data.rozkroj_id,
      koloryPlytyJson,
      data.kolejnosc || null,
      data.uwagi || null,
      data.sciezka_produkcji || 'CIECIE->OKLEJANIE->MAGAZYN'
    ]);
    
    const response = result.rows[0];
    logger.info('Function result:', response);
    
    // Emisja WebSocket
    emitZKOUpdate(data.zko_id, 'zko:pozycja:added', {
      zko_id: data.zko_id,
      pozycja_id: response.pozycja_id,
    });
    
    res.json({
      sukces: true,
      pozycja_id: response.pozycja_id,
      formatki_dodane: response.formatki_dodane,
      komunikat: response.komunikat
    });
    
  } catch (error: any) {
    handleError(res, error, 'add pozycja');
  }
};

/**
 * Handler usuwania pozycji ZKO - używa funkcji zwracającej JSONB
 */
export const handleDeletePozycja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Logowanie szczegółowe
    logger.info(`DELETE request received for pozycja ID: ${id}`);
    logger.info(`Request path: ${req.path}`);
    logger.info(`Request params:`, req.params);
    logger.info(`Request body:`, req.body);
    
    // Body jest opcjonalne dla DELETE
    const uzytkownik = req.body?.uzytkownik || 'system';
    const powod = req.body?.powod || null;
    
    logger.info(`Deleting pozycja ID: ${id}`, { uzytkownik, powod });
    
    // Sprawdź czy ID jest liczbą
    const pozycjaId = Number(id);
    if (isNaN(pozycjaId)) {
      logger.error(`Invalid pozycja ID: ${id}`);
      return res.status(400).json({
        sukces: false,
        error: 'Invalid pozycja ID',
        komunikat: `ID pozycji musi być liczbą, otrzymano: ${id}`
      });
    }
    
    logger.info(`Calling zko.usun_pozycje_zko(${pozycjaId}, '${uzytkownik}', ${powod ? `'${powod}'` : 'NULL'})`);
    
    // Wywołaj funkcję PostgreSQL - zwraca JSONB
    const result = await db.query(
      `SELECT zko.usun_pozycje_zko($1, $2, $3) as result`,
      [pozycjaId, uzytkownik, powod]
    );
    
    // Rozpakuj JSONB
    const response = result.rows[0].result;
    logger.info('Delete result:', response);
    
    if (response.sukces) {
      // Pobierz ZKO ID dla WebSocket - najpierw sprawdź czy pozycja istniała
      try {
        const zkoResult = await db.query(
          `SELECT zko_id FROM zko.pozycje WHERE id = $1 
           UNION 
           SELECT zko_id FROM zko.historia_statusow 
           WHERE komentarz LIKE '%pozycję #${pozycjaId}%' 
           ORDER BY data_zmiany DESC LIMIT 1`,
          [pozycjaId]
        );
        
        if (zkoResult.rows.length > 0) {
          emitZKOUpdate(zkoResult.rows[0].zko_id, 'zko:pozycja:deleted', {
            zko_id: zkoResult.rows[0].zko_id,
            pozycja_id: pozycjaId,
            usuniete_formatki: response.usuniete_formatki,
            usuniete_palety: response.usuniete_palety
          });
        }
      } catch (wsError) {
        logger.warn('Could not emit WebSocket update:', wsError);
      }
    }
    
    res.json(response);
    
  } catch (error: any) {
    logger.error('Error deleting pozycja:', error);
    logger.error('Error stack:', error.stack);
    res.status(500).json({
      sukces: false,
      error: 'Failed to delete pozycja',
      komunikat: error.message,
      details: error.detail || error.hint
    });
  }
};

/**
 * Handler edycji pozycji - używa funkcji zwracającej JSONB
 * Funkcja edytuj_pozycje_zko obsługuje 8 parametrów (z sciezka_produkcji)
 */
export const handleEditPozycja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    logger.info(`PUT request received for pozycja ID: ${id}`);
    logger.info(`Request body:`, data);
    
    // Sprawdź czy ID jest liczbą
    const pozycjaId = Number(id);
    if (isNaN(pozycjaId)) {
      logger.error(`Invalid pozycja ID: ${id}`);
      return res.status(400).json({
        sukces: false,
        error: 'Invalid pozycja ID',
        komunikat: `ID pozycji musi być liczbą, otrzymano: ${id}`
      });
    }
    
    // Logowanie parametrów dla funkcji PostgreSQL
    logger.info(`Calling zko.edytuj_pozycje_zko with params:`, {
      pozycja_id: pozycjaId,
      rozkroj_id: data.rozkroj_id,
      ilosc_plyt: data.ilosc_plyt,
      kolor_plyty: data.kolor_plyty,
      nazwa_plyty: data.nazwa_plyty,
      kolejnosc: data.kolejnosc,
      uwagi: data.uwagi,
      sciezka_produkcji: data.sciezka_produkcji
    });
    
    // Wywołaj funkcję PostgreSQL - zwraca JSONB
    // Funkcja przyjmuje 8 parametrów (włącznie z sciezka_produkcji)
    const result = await db.query(
      `SELECT zko.edytuj_pozycje_zko($1, $2, $3, $4, $5, $6, $7, $8) as result`,
      [
        pozycjaId,
        data.rozkroj_id || null,
        data.ilosc_plyt || null,
        data.kolor_plyty || null,
        data.nazwa_plyty || null,
        data.kolejnosc || null,
        data.uwagi || null,
        data.sciezka_produkcji || null  // 8. parametr - sciezka_produkcji
      ]
    );
    
    // Rozpakuj JSONB
    const response = result.rows[0].result;
    logger.info('Edit result:', response);
    
    if (response.sukces) {
      // Pobierz ZKO ID dla WebSocket
      try {
        const zkoResult = await db.query(
          'SELECT zko_id FROM zko.pozycje WHERE id = $1',
          [pozycjaId]
        );
        
        if (zkoResult.rows.length > 0) {
          emitZKOUpdate(zkoResult.rows[0].zko_id, 'zko:pozycja:updated', {
            zko_id: zkoResult.rows[0].zko_id,
            pozycja_id: pozycjaId,
            changes: data
          });
        }
      } catch (wsError) {
        logger.warn('Could not emit WebSocket update:', wsError);
      }
    }
    
    // Zwróć odpowiedź
    res.json(response);
    
  } catch (error: any) {
    logger.error('Error editing pozycja:', error);
    logger.error('Error stack:', error.stack);
    res.status(500).json({
      sukces: false,
      error: 'Failed to edit pozycja',
      komunikat: error.message,
      details: error.detail || error.hint
    });
  }
};

/**
 * 🔥 NOWY HANDLER - Pobierz formatki z pozycji dla ręcznego zarządzania paletami
 */
export const handleGetPozycjaFormatki = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    logger.info(`GET formatki request for pozycja ID: ${id}`);
    
    // Sprawdź czy ID jest liczbą
    const pozycjaId = Number(id);
    if (isNaN(pozycjaId)) {
      logger.error(`Invalid pozycja ID: ${id}`);
      return res.status(400).json({
        sukces: false,
        error: 'Invalid pozycja ID',
        komunikat: `ID pozycji musi być liczbą, otrzymano: ${id}`
      });
    }
    
    // Pobierz formatki z pozycji wraz z szczegółami
    // WAŻNE: Wyciągamy kolor z nazwy formatki, nie z pozycji!
    const result = await db.query(`
      SELECT 
        pf.id,
        pf.pozycja_id,
        pf.nazwa_formatki,
        pf.dlugosc,
        pf.szerokosc,
        pf.ilosc_planowana,
        pf.sciezka_produkcji,
        pf.typ_formatki,
        pf.typ_plyty,
        pf.kierunek_produkcji,
        pf.wymaga_oklejania,
        pf.wiercone,
        -- Wyciągnij kolor z nazwy formatki (np. "494x368 - BIALY" -> "BIALY")
        CASE 
          WHEN pf.nazwa_formatki LIKE '% - %' THEN 
            TRIM(SPLIT_PART(pf.nazwa_formatki, ' - ', 2))
          ELSE 
            'NIEZNANY'
        END as kolor,
        -- Wyciągnij wymiary z nazwy formatki
        SPLIT_PART(pf.nazwa_formatki, ' - ', 1) as wymiary,
        -- Znajdź nazwę płyty dla konkretnego koloru
        CASE 
          WHEN pf.nazwa_formatki LIKE '% - BIALY' THEN '18_BIALY'
          WHEN pf.nazwa_formatki LIKE '% - WOTAN' THEN '18_WOTAN'
          WHEN pf.nazwa_formatki LIKE '% - SONOMA' THEN '18_SONOMA'
          WHEN pf.nazwa_formatki LIKE '% - CZARNY' THEN '18_CZARNY'
          WHEN pf.nazwa_formatki LIKE '% - SZARY' THEN '18_SZARY'
          ELSE CONCAT('18_', TRIM(SPLIT_PART(pf.nazwa_formatki, ' - ', 2)))
        END as nazwa_plyty,
        18 as grubosc,  -- Domyślna grubość płyty
        -- Oblicz wagę teoretyczną (dł × szer × grub × gęstość) / konwersja na kg
        (pf.dlugosc * pf.szerokosc * 18 * 0.8) / 1000000000.0 as waga_sztuki,
        p.id as pozycja_id_parent,
        p.zko_id,
        -- Oblicz ile już jest przypisane do palet
        COALESCE((
          SELECT SUM(pfi.ilosc) 
          FROM zko.palety_formatki_ilosc pfi 
          JOIN zko.palety pal ON pal.id = pfi.paleta_id
          WHERE pfi.formatka_id = pf.id 
          AND pal.pozycja_id = p.id
        ), 0) as ilosc_na_paletach
      FROM zko.pozycje_formatki pf
      JOIN zko.pozycje p ON p.id = pf.pozycja_id
      WHERE pf.pozycja_id = $1
      ORDER BY pf.nazwa_formatki
    `, [pozycjaId]);
    
    logger.info(`Found ${result.rows.length} formatki for pozycja ${pozycjaId}`);
    
    // Dodaj informacje o dostępności i mapuj nazwy pól dla kompatybilności
    const formatkiWithAvailability = result.rows.map(formatka => ({
      id: formatka.id,
      pozycja_id: formatka.pozycja_id,
      nazwa_formatki: formatka.nazwa_formatki,
      dlugosc: parseFloat(formatka.dlugosc),
      szerokosc: parseFloat(formatka.szerokosc),
      wymiar_x: parseFloat(formatka.dlugosc),
      wymiar_y: parseFloat(formatka.szerokosc),
      grubosc: formatka.grubosc,
      kolor: formatka.kolor,
      kolor_plyty: formatka.kolor,
      nazwa_plyty: formatka.nazwa_plyty,
      wymiary: formatka.wymiary,
      ilosc_planowana: formatka.ilosc_planowana,
      ilosc_na_paletach: formatka.ilosc_na_paletach,
      ilosc_dostepna: Math.max(0, formatka.ilosc_planowana - formatka.ilosc_na_paletach),
      sztuki_dostepne: Math.max(0, formatka.ilosc_planowana - formatka.ilosc_na_paletach),
      waga_sztuki: formatka.waga_sztuki,
      waga_sztuka: formatka.waga_sztuki,
      typ_formatki: formatka.typ_formatki || 'standard',
      typ_plyty: formatka.typ_plyty || 'laminat',
      kierunek_produkcji: formatka.kierunek_produkcji || 'STANDARD',
      sciezka_produkcji: formatka.sciezka_produkcji || 'CIECIE->OKLEJANIE->MAGAZYN',
      wymaga_oklejania: formatka.wymaga_oklejania !== false,
      wiercone: formatka.wiercone === true,
      czy_w_pelni_przypisana: formatka.ilosc_planowana <= formatka.ilosc_na_paletach
    }));
    
    res.json({
      sukces: true,
      pozycja_id: pozycjaId,
      formatki: formatkiWithAvailability,
      total: formatkiWithAvailability.length,
      podsumowanie: {
        formatki_total: formatkiWithAvailability.length,
        sztuk_planowanych: formatkiWithAvailability.reduce((sum, f) => sum + f.ilosc_planowana, 0),
        sztuk_na_paletach: formatkiWithAvailability.reduce((sum, f) => sum + f.ilosc_na_paletach, 0),
        sztuk_dostepnych: formatkiWithAvailability.reduce((sum, f) => sum + f.ilosc_dostepna, 0)
      }
    });
    
  } catch (error: any) {
    logger.error('Error fetching pozycja formatki:', error);
    res.status(500).json({
      sukces: false,
      error: 'Failed to fetch pozycja formatki',
      komunikat: error.message
    });
  }
};
