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
 * UWAGA: Aktualnie funkcja edytuj_pozycje_zko NIE obsługuje sciezka_produkcji
 * Dlatego pomijamy ten parametr dopóki funkcja PostgreSQL nie zostanie zaktualizowana
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
    
    // WAŻNE: Pomijamy sciezka_produkcji dopóki funkcja PostgreSQL nie zostanie zaktualizowana
    // Usuń sciezka_produkcji z danych jeśli istnieje
    const { sciezka_produkcji, ...dataWithoutSciezka } = data;
    
    if (sciezka_produkcji) {
      logger.warn(`Parametr sciezka_produkcji (${sciezka_produkcji}) zostanie pominięty - funkcja edytuj_pozycje_zko nie obsługuje tego parametru`);
    }
    
    // Logowanie parametrów dla funkcji PostgreSQL
    logger.info(`Calling zko.edytuj_pozycje_zko with params:`, {
      pozycja_id: pozycjaId,
      rozkroj_id: dataWithoutSciezka.rozkroj_id,
      ilosc_plyt: dataWithoutSciezka.ilosc_plyt,
      kolor_plyty: dataWithoutSciezka.kolor_plyty,
      nazwa_plyty: dataWithoutSciezka.nazwa_plyty,
      kolejnosc: dataWithoutSciezka.kolejnosc,
      uwagi: dataWithoutSciezka.uwagi
    });
    
    // Wywołaj funkcję PostgreSQL - zwraca JSONB
    // UWAGA: Tylko 7 parametrów, bez sciezka_produkcji
    const result = await db.query(
      `SELECT zko.edytuj_pozycje_zko($1, $2, $3, $4, $5, $6, $7) as result`,
      [
        pozycjaId,
        dataWithoutSciezka.rozkroj_id || null,
        dataWithoutSciezka.ilosc_plyt || null,
        dataWithoutSciezka.kolor_plyty || null,
        dataWithoutSciezka.nazwa_plyty || null,
        dataWithoutSciezka.kolejnosc || null,
        dataWithoutSciezka.uwagi || null
      ]
    );
    
    // Rozpakuj JSONB
    const response = result.rows[0].result;
    logger.info('Edit result:', response);
    
    // Jeśli sukces i mamy sciezka_produkcji, zaktualizuj formatki osobno
    if (response.sukces && sciezka_produkcji) {
      try {
        logger.info(`Updating sciezka_produkcji for formatki of pozycja ${pozycjaId}`);
        await db.query(
          `UPDATE zko.pozycje_formatki 
           SET sciezka_produkcji = $1, updated_at = NOW()
           WHERE pozycja_id = $2`,
          [sciezka_produkcji, pozycjaId]
        );
        logger.info(`Updated sciezka_produkcji to ${sciezka_produkcji} for pozycja ${pozycjaId}`);
      } catch (updateError) {
        logger.error('Error updating sciezka_produkcji:', updateError);
        // Nie przerywamy operacji - główna edycja się powiodła
      }
    }
    
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
    const result = await db.query(`
      SELECT 
        pf.id,
        pf.nazwa_formatki as nazwa,
        pf.dlugosc as dlugosc,
        pf.szerokosc as szerokosc,
        18 as grubosc,  -- Domyślna grubość płyty
        p.kolor_plyty as kolor,
        pf.ilosc_planowana,
        pf.sciezka_produkcji,
        -- Oblicz wagę teoretyczną (dł × szer × grub × gęstość) / konwersja na kg
        (pf.dlugosc * pf.szerokosc * 18 * 0.8) / 1000000000.0 as waga_sztuka,
        pf.typ_formatki,
        p.id as pozycja_id,
        p.zko_id,
        -- Oblicz ile już jest przypisane do palet
        COALESCE((
          SELECT SUM(pfi.ilosc) 
          FROM zko.palety_formatki_ilosc pfi 
          JOIN zko.palety pal ON pal.id = pfi.paleta_id
          WHERE pfi.formatka_id = pf.id 
          AND pal.pozycja_id = p.id
        ), 0) as ilosc_w_paletach
      FROM zko.pozycje_formatki pf
      JOIN zko.pozycje p ON p.id = pf.pozycja_id
      WHERE pf.pozycja_id = $1
      ORDER BY pf.nazwa_formatki
    `, [pozycjaId]);
    
    logger.info(`Found ${result.rows.length} formatki for pozycja ${pozycjaId}`);
    
    // Dodaj informacje o dostępności
    const formatkiWithAvailability = result.rows.map(formatka => ({
      ...formatka,
      ilosc_dostepna: Math.max(0, formatka.ilosc_planowana - formatka.ilosc_w_paletach),
      czy_w_pelni_przypisana: formatka.ilosc_planowana <= formatka.ilosc_w_paletach
    }));
    
    res.json({
      sukces: true,
      pozycja_id: pozycjaId,
      formatki: formatkiWithAvailability,
      total: formatkiWithAvailability.length,
      podsumowanie: {
        formatki_total: formatkiWithAvailability.length,
        sztuk_planowanych: formatkiWithAvailability.reduce((sum, f) => sum + f.ilosc_planowana, 0),
        sztuk_w_paletach: formatkiWithAvailability.reduce((sum, f) => sum + f.ilosc_w_paletach, 0),
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
