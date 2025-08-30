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
  uwagi: z.string().optional()
});

/**
 * POST /api/pallets/manual/create - Ręczne tworzenie palety z kontrolą przeznaczenia
 */
router.post('/manual/create', async (req: Request, res: Response) => {
  let client;
  
  try {
    const params = ManualPaletaSchema.parse(req.body);
    
    client = await db.connect();
    await client.query('BEGIN');
    
    logger.info(`Creating manual pallet for position ${params.pozycja_id} with destination ${params.przeznaczenie}`);
    
    // Wywołaj POPRAWIONĄ funkcję tworzenia ręcznej palety
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
    
    // WebSocket notification
    const pozycjaResult = await db.query(
      'SELECT zko_id FROM zko.pozycje WHERE id = $1',
      [params.pozycja_id]
    );
    
    if (pozycjaResult.rows[0]) {
      emitZKOUpdate(pozycjaResult.rows[0].zko_id, 'pallets:manual-created', {
        paleta_id: response.paleta_id,
        numer_palety: response.numer_palety,
        przeznaczenie: params.przeznaczenie,
        statystyki: response.statystyki
      });
    }
    
    logger.info(`Manual pallet created: ${response.numer_palety} for ${params.przeznaczenie}`);
    
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
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Błąd walidacji danych',
        details: error.errors
      });
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
 * POST /api/pallets/manual/batch - Tworzenie wielu palet jednocześnie
 */
router.post('/manual/batch', async (req: Request, res: Response) => {
  let client;
  
  try {
    const { pozycja_id, palety } = req.body;
    
    if (!pozycja_id || !Array.isArray(palety)) {
      return res.status(400).json({
        error: 'Wymagane: pozycja_id i tablica palet'
      });
    }
    
    client = await db.connect();
    await client.query('BEGIN');
    
    const utworzonePalety = [];
    
    for (const paleta of palety) {
      const params = ManualPaletaSchema.parse({
        pozycja_id,
        ...paleta
      });
      
      // Użyj POPRAWIONEJ funkcji
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
          error: `Błąd tworzenia palety: ${response.komunikat}`,
          sukces: false
        });
      }
      
      utworzonePalety.push(response);
    }
    
    await client.query('COMMIT');
    
    // WebSocket notification
    const pozycjaResult = await db.query(
      'SELECT zko_id FROM zko.pozycje WHERE id = $1',
      [pozycja_id]
    );
    
    if (pozycjaResult.rows[0]) {
      emitZKOUpdate(pozycjaResult.rows[0].zko_id, 'pallets:batch-created', {
        pozycja_id,
        palety_utworzone: utworzonePalety.length,
        palety: utworzonePalety.map(p => ({
          id: p.paleta_id,
          numer: p.numer_palety,
          statystyki: p.statystyki
        }))
      });
    }
    
    logger.info(`Created ${utworzonePalety.length} manual pallets for position ${pozycja_id}`);
    
    res.json({
      sukces: true,
      palety_utworzone: utworzonePalety,
      komunikat: `Utworzono ${utworzonePalety.length} palet`
    });
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Błąd walidacji danych',
        details: error.errors
      });
    }
    
    logger.error('Error creating batch pallets:', error);
    res.status(500).json({ 
      error: 'Błąd tworzenia palet',
      message: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * GET /api/pallets/position/:pozycjaId - Pobierz palety dla pozycji
 */
router.get('/position/:pozycjaId', async (req: Request, res: Response) => {
  try {
    const pozycjaId = parseInt(req.params.pozycjaId);
    
    if (isNaN(pozycjaId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID pozycji'
      });
    }
    
    const result = await db.query(`
      SELECT 
        p.id,
        p.numer_palety,
        p.przeznaczenie,
        p.ilosc_formatek,
        p.waga_kg,
        p.wysokosc_stosu,
        p.max_waga_kg,
        p.max_wysokosc_mm,
        p.status,
        p.kolory_na_palecie,
        p.uwagi,
        p.created_at,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'formatka_id', pfi.formatka_id,
              'ilosc', pfi.ilosc,
              'nazwa', pf.nazwa_formatki,
              'kolor', pos.kolor_plyty
            ) ORDER BY pf.id
          ) FILTER (WHERE pfi.formatka_id IS NOT NULL),
          '[]'::jsonb
        ) as formatki
      FROM zko.palety p
      LEFT JOIN zko.palety_formatki_ilosc pfi ON pfi.paleta_id = p.id
      LEFT JOIN zko.pozycje_formatki pf ON pf.id = pfi.formatka_id
      LEFT JOIN zko.pozycje pos ON pos.id = pf.pozycja_id
      WHERE p.pozycja_id = $1
      GROUP BY p.id
      ORDER BY p.numer_palety
    `, [pozycjaId]);
    
    res.json({
      sukces: true,
      palety: result.rows,
      total: result.rows.length
    });
    
  } catch (error: any) {
    logger.error('Error fetching position pallets:', error);
    res.status(500).json({
      error: 'Błąd pobierania palet',
      message: error.message
    });
  }
});

/**
 * PUT /api/pallets/:paletaId/destination - Zmień przeznaczenie palety
 */
router.put('/:paletaId/destination', async (req: Request, res: Response) => {
  try {
    const paletaId = parseInt(req.params.paletaId);
    const { przeznaczenie } = req.body;
    
    if (isNaN(paletaId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID palety'
      });
    }
    
    if (!['MAGAZYN', 'OKLEINIARKA', 'WIERCENIE', 'CIECIE', 'WYSYLKA'].includes(przeznaczenie)) {
      return res.status(400).json({
        error: 'Nieprawidłowe przeznaczenie'
      });
    }
    
    const result = await db.query(`
      UPDATE zko.palety 
      SET 
        przeznaczenie = $1,
        kierunek = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING id, numer_palety, przeznaczenie
    `, [przeznaczenie, paletaId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Paleta nie istnieje'
      });
    }
    
    logger.info(`Changed pallet ${paletaId} destination to ${przeznaczenie}`);
    
    res.json({
      sukces: true,
      paleta: result.rows[0],
      komunikat: `Zmieniono przeznaczenie na ${przeznaczenie}`
    });
    
  } catch (error: any) {
    logger.error('Error updating pallet destination:', error);
    res.status(500).json({
      error: 'Błąd zmiany przeznaczenia',
      message: error.message
    });
  }
});

/**
 * 🔥 NOWY ENDPOINT - GET /api/pallets/position/:pozycjaId/available-formatki
 * Pobierz dostępne formatki z pozycji (jeszcze nie przypisane do palet)
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
        pf.dlugosc as dlugosc,
        pf.szerokosc as szerokosc,
        18 as grubosc,  -- Domyślna grubość płyty
        p.kolor_plyty as kolor,
        pf.ilosc_planowana,
        -- Oblicz wagę teoretyczną
        (pf.dlugosc * pf.szerokosc * 18 * 0.8) / 1000000000.0 as waga_sztuka,
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
    
    // Dodaj informacje o dostępności
    const formatkiWithAvailability = result.rows.map(formatka => ({
      ...formatka,
      ilosc_dostepna: Math.max(0, formatka.ilosc_planowana - formatka.ilosc_w_paletach),
      czy_w_pelni_przypisana: formatka.ilosc_planowana <= formatka.ilosc_w_paletach
    }));
    
    logger.info(`Found ${formatkiWithAvailability.length} formatki for pozycja ${pozycjaId}`);
    
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
 * 🔥 NOWY ENDPOINT - POST /api/pallets/manual/create-all-remaining
 * Utwórz paletę ze wszystkimi pozostałymi formatkami z pozycji
 */
router.post('/manual/create-all-remaining', async (req: Request, res: Response) => {
  let client;
  
  try {
    const { pozycja_id, przeznaczenie = 'MAGAZYN', operator = 'user' } = req.body;
    
    if (!pozycja_id) {
      return res.status(400).json({
        error: 'Wymagane: pozycja_id'
      });
    }
    
    client = await db.connect();
    await client.query('BEGIN');
    
    // Pobierz wszystkie dostępne formatki z pozycji
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
    
    // Przygotuj dane formatek
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
    
    logger.info(`Creating pallet with all remaining formatki for position ${pozycja_id}: ${formatki.length} types`);
    
    // Użyj funkcji tworzenia palety
    const result = await client.query(`
      SELECT * FROM zko.pal_utworz_reczna_palete_v2($1, $2, $3, $4, $5, $6, $7)
    `, [
      pozycja_id,
      JSON.stringify(formatki),
      przeznaczenie,
      700, // max_waga
      1440, // max_wysokosc
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
    
    // WebSocket notification
    const pozycjaResult = await db.query(
      'SELECT zko_id FROM zko.pozycje WHERE id = $1',
      [pozycja_id]
    );
    
    if (pozycjaResult.rows[0]) {
      emitZKOUpdate(pozycjaResult.rows[0].zko_id, 'pallets:all-remaining-created', {
        paleta_id: response.paleta_id,
        numer_palety: response.numer_palety,
        przeznaczenie,
        formatki_types: formatki.length,
        total_sztuk: formatki.reduce((sum, f) => sum + f.ilosc, 0)
      });
    }
    
    logger.info(`Created pallet with all remaining formatki: ${response.numer_palety}`);
    
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