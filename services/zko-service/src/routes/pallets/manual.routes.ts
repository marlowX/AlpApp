import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import pino from 'pino';
import { z } from 'zod';

const router = Router();
const logger = pino();

// Schema dla ręcznego tworzenia palety
const ManualPaletaSchema = z.object({
  pozycja_id: z.number().int().positive(),
  formatki: z.array(z.object({
    formatka_id: z.number().int().positive(),
    ilosc: z.number().int().positive()
  })),
  przeznaczenie: z.enum(['MAGAZYN', 'OKLEINIARKA', 'WIERCENIE', 'CIECIE', 'WYSYLKA']).default('MAGAZYN'),
  max_waga: z.number().default(700),
  max_wysokosc: z.number().default(1440),
  operator: z.string().default('system'),
  uwagi: z.string().nullable().optional().transform(val => val || null)
});

/**
 * GET /api/pallets/position/:pozycjaId/available-formatki
 * NAPRAWIONE: Konsystentny kolor i usunieto numer pozycji z tego endpointa
 */
router.get('/position/:pozycjaId/available-formatki', async (req: Request, res: Response) => {
  try {
    const pozycjaId = parseInt(req.params.pozycjaId);
    
    if (isNaN(pozycjaId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID pozycji'
      });
    }
    
    const result = await db.query(`
      SELECT 
        pf.id,
        pf.nazwa_formatki as nazwa,
        pf.dlugosc,
        pf.szerokosc,
        18 as grubosc,
        p.kolor_plyty as kolor,
        p.id as pozycja_id,
        p.nazwa_plyty,
        pf.ilosc_planowana,
        (pf.dlugosc * pf.szerokosc * 18 * 0.8) / 1000000000.0 as waga_sztuka,
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
    logger.error('Error fetching available formatki:', error);
    res.status(500).json({
      error: 'Błąd pobierania dostępnych formatek',
      message: error.message
    });
  }
});

/**
 * POST /api/pallets/manual/create - Ręczne tworzenie palety
 */
router.post('/manual/create', async (req: Request, res: Response) => {
  let client;
  
  try {
    const params = ManualPaletaSchema.parse(req.body);
    
    client = await db.connect();
    await client.query('BEGIN');
    
    const result = await client.query(`
      SELECT * FROM zko.pal_utworz_reczna_palete_v2($1, $2, $3, $4, $5, $6, $7)
    `, [
      params.pozycja_id,
      JSON.stringify(params.formatki),
      params.przeznaczenie,
      params.max_waga,
      params.max_wysokosc,
      params.operator,
      params.uwagi || null
    ]);
    
    const response = result.rows[0];
    
    if (!response.sukces) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: response.komunikat,
        sukces: false
      });
    }
    
    await client.query('COMMIT');
    
    res.json({
      sukces: true,
      paleta_id: response.paleta_id,
      numer_palety: response.numer_palety,
      komunikat: response.komunikat,
      statystyki: response.statystyki
    });
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    logger.error('Error creating manual pallet:', error);
    res.status(500).json({ 
      error: 'Błąd tworzenia palety',
      message: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * POST /api/pallets/manual/batch - Tworzenie wielu palet
 */
router.post('/manual/batch', async (req: Request, res: Response) => {
  let client;
  
  try {
    const pozycja_id = typeof req.body.pozycja_id === 'string' 
      ? parseInt(req.body.pozycja_id, 10)
      : req.body.pozycja_id;
      
    const { palety } = req.body;
    
    if (!pozycja_id || isNaN(pozycja_id)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID pozycji',
        sukces: false
      });
    }
    
    const niepustePalety = palety.filter(p => 
      p && p.formatki && Array.isArray(p.formatki) && p.formatki.length > 0
    );
    
    if (niepustePalety.length === 0) {
      return res.status(400).json({
        error: 'Brak palet z formatkami do zapisania',
        sukces: false
      });
    }
    
    client = await db.connect();
    await client.query('BEGIN');
    
    const utworzonePalety = [];
    
    for (let i = 0; i < niepustePalety.length; i++) {
      const paleta = niepustePalety[i];
      
      const params = ManualPaletaSchema.parse({
        pozycja_id,
        ...paleta,
        operator: paleta.operator || 'user',
        uwagi: paleta.uwagi || `Paleta ${i + 1} z pozycji ${pozycja_id}`
      });
      
      const result = await client.query(`
        SELECT * FROM zko.pal_utworz_reczna_palete_v2($1, $2, $3, $4, $5, $6, $7)
      `, [
        params.pozycja_id,
        JSON.stringify(params.formatki),
        params.przeznaczenie,
        params.max_waga,
        params.max_wysokosc,
        params.operator,
        params.uwagi
      ]);
      
      const response = result.rows[0];
      
      if (!response.sukces) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Błąd tworzenia palety ${i + 1}: ${response.komunikat}`,
          sukces: false
        });
      }
      
      utworzonePalety.push(response);
    }
    
    await client.query('COMMIT');
    
    res.json({
      sukces: true,
      palety_utworzone: utworzonePalety,
      komunikat: `Utworzono ${utworzonePalety.length} palet`,
      total: utworzonePalety.length
    });
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    logger.error('Error creating batch pallets:', error);
    res.status(500).json({ 
      error: 'Błąd tworzenia palet',
      message: error.message,
      sukces: false
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * POST /api/pallets/manual/create-all-remaining
 */
router.post('/manual/create-all-remaining', async (req: Request, res: Response) => {
  let client;
  
  try {
    const pozycja_id = typeof req.body.pozycja_id === 'string' 
      ? parseInt(req.body.pozycja_id, 10)
      : req.body.pozycja_id;
      
    const { przeznaczenie = 'MAGAZYN', operator = 'user' } = req.body;
    
    if (!pozycja_id || isNaN(pozycja_id)) {
      return res.status(400).json({
        error: 'Wymagane: pozycja_id (jako liczba)'
      });
    }
    
    client = await db.connect();
    await client.query('BEGIN');
    
    const formatkiResult = await client.query(`
      SELECT 
        pf.id as formatka_id,
        pf.ilosc_planowana - COALESCE((
          SELECT SUM(pfi.ilosc) 
          FROM zko.palety_formatki_ilosc pfi 
          JOIN zko.palety pal ON pal.id = pfi.paleta_id
          WHERE pfi.formatka_id = pf.id 
          AND pal.pozycja_id = $1
        ), 0) as ilosc_dostepna
      FROM zko.pozycje_formatki pf
      WHERE pf.pozycja_id = $1
      AND pf.ilosc_planowana > COALESCE((
        SELECT SUM(pfi.ilosc) 
        FROM zko.palety_formatki_ilosc pfi 
        JOIN zko.palety pal ON pal.id = pfi.paleta_id
        WHERE pfi.formatka_id = pf.id 
        AND pal.pozycja_id = $1
      ), 0)
    `, [pozycja_id]);
    
    if (formatkiResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Brak dostępnych formatek do przypisania',
        sukces: false
      });
    }
    
    const formatki = formatkiResult.rows
      .filter(f => f.ilosc_dostepna > 0)
      .map(f => ({
        formatka_id: f.formatka_id,
        ilosc: f.ilosc_dostepna
      }));
    
    if (formatki.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Brak formatek o dostępnej ilości > 0',
        sukces: false
      });
    }
    
    const result = await client.query(`
      SELECT * FROM zko.pal_utworz_reczna_palete_v2($1, $2, $3, $4, $5, $6, $7)
    `, [
      pozycja_id,
      JSON.stringify(formatki),
      przeznaczenie,
      700,
      1440,
      operator,
      `Paleta ze wszystkimi pozostałymi formatkami (${formatki.length} typów)`
    ]);
    
    const response = result.rows[0];
    
    if (!response.sukces) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: response.komunikat,
        sukces: false
      });
    }
    
    await client.query('COMMIT');
    
    res.json({
      sukces: true,
      paleta_id: response.paleta_id,
      numer_palety: response.numer_palety,
      komunikat: response.komunikat,
      statystyki: response.statystyki,
      formatki_dodane: formatki.length,
      total_sztuk: formatki.reduce((sum, f) => sum + f.ilosc, 0)
    });
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    logger.error('Error creating all-remaining pallet:', error);
    res.status(500).json({ 
      error: 'Błąd tworzenia palety ze wszystkimi formatkami',
      message: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

export default router;