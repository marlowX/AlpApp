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
    
    // Wywołaj funkcję PostgreSQL
    const result = await db.query(`
      SELECT * FROM zko.dodaj_pozycje_do_zko($1, $2, $3::jsonb, $4, $5)
    `, [
      data.zko_id,
      data.rozkroj_id,
      koloryPlytyJson,
      data.kolejnosc || null,
      data.uwagi || null
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
    
    // Body jest opcjonalne dla DELETE
    const uzytkownik = req.body?.uzytkownik || 'system';
    const powod = req.body?.powod || null;
    
    logger.info(`Deleting pozycja ID: ${id}`, { uzytkownik, powod });
    
    // Wywołaj funkcję PostgreSQL - zwraca JSONB
    const result = await db.query(
      `SELECT zko.usun_pozycje_zko($1, $2, $3) as result`,
      [Number(id), uzytkownik, powod]
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
           WHERE komentarz LIKE '%pozycję #${id}%' 
           ORDER BY data_zmiany DESC LIMIT 1`,
          [id]
        );
        
        if (zkoResult.rows.length > 0) {
          emitZKOUpdate(zkoResult.rows[0].zko_id, 'zko:pozycja:deleted', {
            zko_id: zkoResult.rows[0].zko_id,
            pozycja_id: Number(id),
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
    res.status(500).json({
      sukces: false,
      error: 'Failed to delete pozycja',
      komunikat: error.message
    });
  }
};

/**
 * Handler edycji pozycji - używa funkcji zwracającej JSONB
 */
export const handleEditPozycja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    logger.info(`Editing pozycja ID: ${id}`, data);
    
    // Wywołaj funkcję PostgreSQL
    const result = await db.query(
      `SELECT 
        (result->>'sukces')::boolean as sukces,
        result->>'komunikat' as komunikat,
        result->'pozycja' as pozycja
       FROM (
         SELECT zko.edytuj_pozycje_zko($1, $2, $3, $4, $5, $6, $7) as result
       ) t`,
      [
        Number(id),
        data.rozkroj_id || null,
        data.ilosc_plyt || null,
        data.kolor_plyty || null,
        data.nazwa_plyty || null,
        data.kolejnosc || null,
        data.uwagi || null
      ]
    );
    
    const response = result.rows[0];
    logger.info('Edit result:', response);
    
    if (response.sukces) {
      // Pobierz ZKO ID dla WebSocket
      const zkoResult = await db.query(
        'SELECT zko_id FROM zko.pozycje WHERE id = $1',
        [id]
      );
      
      if (zkoResult.rows.length > 0) {
        emitZKOUpdate(zkoResult.rows[0].zko_id, 'zko:pozycja:updated', {
          zko_id: zkoResult.rows[0].zko_id,
          pozycja_id: Number(id),
          changes: data
        });
      }
    }
    
    res.json(response);
    
  } catch (error: any) {
    logger.error('Error editing pozycja:', error);
    res.status(500).json({
      sukces: false,
      error: 'Failed to edit pozycja',
      komunikat: error.message
    });
  }
};