import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import pino from 'pino';
import { z } from 'zod';
import { ClosePalletSchema, ReorganizePalletSchema } from './schemas';

const router = Router();
const logger = pino();

/**
 * POST /api/pallets/:id/update-formatki - Aktualizuj formatki na palecie
 * UŻYWA FUNKCJI POSTGRESQL pal_edytuj
 */
router.post('/:id/update-formatki', async (req: Request, res: Response) => {
  try {
    const paletaId = parseInt(req.params.id);
    const { formatki, przeznaczenie, uwagi } = req.body;
    
    if (isNaN(paletaId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID palety'
      });
    }
    
    // Formatki mogą być puste (pusta paleta)
    if (!Array.isArray(formatki)) {
      return res.status(400).json({
        error: 'Formatki muszą być tablicą'
      });
    }
    
    logger.info(`Updating pallet ${paletaId} using pal_edytuj function`, { 
      formatki_count: formatki.length,
      przeznaczenie 
    });
    
    // Wywołaj funkcję PostgreSQL pal_edytuj
    const result = await db.query(
      `SELECT * FROM zko.pal_edytuj($1, $2::jsonb, $3, $4, $5)`,
      [
        paletaId,
        JSON.stringify(formatki), // konwertuj tablicę na JSONB
        przeznaczenie || null,
        uwagi || null,
        'user' // operator
      ]
    );
    
    const response = result.rows[0].pal_edytuj; // Funkcja zwraca obiekt w kolumnie pal_edytuj
    
    logger.info(`Function pal_edytuj returned:`, response);
    
    // Sprawdź sukces - może być string lub boolean
    const isSuccess = response.sukces === true || response.sukces === 'true';
    
    if (isSuccess) {
      // Emit WebSocket event
      if (response.zko_id) {
        emitZKOUpdate(response.zko_id, 'pallet:updated', {
          paleta_id: paletaId,
          numer_palety: response.numer_palety,
          formatki_count: response.sztuk_total,
          przeznaczenie: response.przeznaczenie
        });
      }
      
      logger.info(`Successfully updated pallet ${paletaId}`, response);
      res.json(response);
    } else {
      logger.error(`Failed to update pallet ${paletaId}:`, response.komunikat);
      res.status(400).json(response);
    }
    
  } catch (error: any) {
    logger.error('Error updating pallet:', error);
    res.status(500).json({ 
      error: 'Błąd aktualizacji palety',
      message: error.message,
      details: error.stack
    });
  }
});

/**
 * GET /api/pallets/:id - Pobieranie szczegółów pojedynczej palety
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const paletaId = parseInt(req.params.id);
    
    if (isNaN(paletaId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID palety'
      });
    }
    
    logger.info(`Fetching pallet details for ID ${paletaId}`);
    
    // Pobierz szczegóły palety z formatkami
    const result = await db.query(`
      SELECT 
        p.*,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'formatka_id', pfi.formatka_id,
              'pozycja_id', pf.pozycja_id,
              'ilosc', pfi.ilosc,
              'nazwa', pf.nazwa_formatki,
              'dlugosc', pf.dlugosc,
              'szerokosc', pf.szerokosc,
              'kolor', poz.kolor_plyty,
              'nazwa_plyty', poz.nazwa_plyty
            ) ORDER BY pf.pozycja_id, pf.id
          ) FILTER (WHERE pfi.formatka_id IS NOT NULL),
          '[]'::jsonb
        ) as formatki_szczegoly
      FROM zko.palety p
      LEFT JOIN zko.palety_formatki_ilosc pfi ON pfi.paleta_id = p.id
      LEFT JOIN zko.pozycje_formatki pf ON pf.id = pfi.formatka_id
      LEFT JOIN zko.pozycje poz ON poz.id = pf.pozycja_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [paletaId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Paleta nie znaleziona'
      });
    }
    
    res.json(result.rows[0]);
    
  } catch (error: any) {
    logger.error('Error fetching pallet details:', error);
    res.status(500).json({ 
      error: 'Błąd pobierania szczegółów palety',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/pallets/:id/clear-formatki - Wyczyść wszystkie formatki z palety
 */
router.delete('/:id/clear-formatki', async (req: Request, res: Response) => {
  try {
    const paletaId = parseInt(req.params.id);
    
    if (isNaN(paletaId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID palety'
      });
    }
    
    logger.info(`Clearing formatki from pallet ${paletaId} using pal_edytuj function`);
    
    // Użyj funkcji pal_edytuj z pustą tablicą formatek
    const result = await db.query(
      `SELECT * FROM zko.pal_edytuj($1, $2::jsonb, $3, $4, $5)`,
      [
        paletaId,
        JSON.stringify([]), // pusta tablica formatek
        null, // przeznaczenie
        'Wyczyszczono wszystkie formatki', // uwagi
        'user' // operator
      ]
    );
    
    const response = result.rows[0].pal_edytuj;
    const isSuccess = response.sukces === true || response.sukces === 'true';
    
    if (isSuccess) {
      logger.info(`Cleared formatki from pallet ${paletaId}`);
      res.json(response);
    } else {
      res.status(400).json(response);
    }
    
  } catch (error: any) {
    logger.error('Error clearing formatki:', error);
    res.status(500).json({ 
      error: 'Błąd czyszczenia palety',
      message: error.message 
    });
  }
});

/**
 * GET /api/pallets/zko/:zkoId - Pobieranie palet dla ZKO
 */
router.get('/zko/:zkoId', async (req: Request, res: Response) => {
  try {
    const zkoId = parseInt(req.params.zkoId);
    
    if (isNaN(zkoId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO',
        details: 'ID ZKO musi być liczbą'
      });
    }
    
    logger.info(`Fetching pallets for ZKO ${zkoId}`);
    
    // Pobierz palety z dodatkowymi informacjami
    const paletyResult = await db.query(`
      SELECT 
        p.*,
        COALESCE(array_length(p.formatki_ids, 1), 0) as ilosc_formatek,
        CASE 
          WHEN p.formatki_ids IS NOT NULL AND array_length(p.formatki_ids, 1) > 0 
          THEN (
            SELECT STRING_AGG(DISTINCT poz.kolor_plyty, ', ')
            FROM unnest(p.formatki_ids) AS fid
            JOIN zko.pozycje_formatki pf ON pf.id = fid::int
            JOIN zko.pozycje poz ON poz.id = pf.pozycja_id
          )
          ELSE NULL
        END as kolory_na_palecie
      FROM zko.palety p
      WHERE p.zko_id = $1
      ORDER BY p.id
    `, [zkoId]);
    
    // Pobierz podsumowanie ZKO
    const zkoSummary = await db.query(`
      SELECT 
        COUNT(DISTINCT pf.id) as total_formatki,
        SUM(pf.ilosc_planowana) as total_ilosc,
        COUNT(DISTINCT p.id) as total_pozycje
      FROM zko.pozycje p
      LEFT JOIN zko.pozycje_formatki pf ON pf.pozycja_id = p.id
      WHERE p.zko_id = $1
    `, [zkoId]);
    
    logger.info(`Found ${paletyResult.rows.length} pallets for ZKO ${zkoId}`);
    
    res.json({
      palety: paletyResult.rows,
      podsumowanie: zkoSummary.rows[0] || {
        total_formatki: 0,
        total_ilosc: 0,
        total_pozycje: 0
      }
    });
    
  } catch (error: any) {
    logger.error('Error fetching pallets:', error);
    res.status(500).json({ 
      error: 'Błąd pobierania palet',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/pallets/:id - Usuwanie pojedynczej palety
 */
router.delete('/:id', async (req: Request, res: Response) => {
  let client;
  
  try {
    const paletaId = parseInt(req.params.id);
    
    if (isNaN(paletaId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID palety'
      });
    }
    
    client = await db.connect();
    await client.query('BEGIN');
    
    logger.info(`Deleting pallet ${paletaId}`);
    
    // Pobierz info o palecie przed usunięciem
    const paletaResult = await client.query(
      'SELECT * FROM zko.palety WHERE id = $1',
      [paletaId]
    );
    
    if (paletaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Paleta nie istnieje'
      });
    }
    
    const paleta = paletaResult.rows[0];
    
    // Najpierw usuń powiązania z tabeli palety_formatki_ilosc
    await client.query(
      'DELETE FROM zko.palety_formatki_ilosc WHERE paleta_id = $1',
      [paletaId]
    );
    
    // Usuń historię palety jeśli istnieje
    await client.query(
      'DELETE FROM zko.palety_historia WHERE paleta_id = $1',
      [paletaId]
    );
    
    // Usuń paletę
    await client.query(
      'DELETE FROM zko.palety WHERE id = $1',
      [paletaId]
    );
    
    await client.query('COMMIT');
    
    // Emit event
    if (paleta.zko_id) {
      emitZKOUpdate(paleta.zko_id, 'pallet:deleted', {
        paleta_id: paletaId,
        numer_palety: paleta.numer_palety
      });
    }
    
    logger.info(`Deleted pallet ${paletaId} (${paleta.numer_palety})`);
    
    res.json({
      sukces: true,
      komunikat: `Usunięto paletę ${paleta.numer_palety}`,
      paleta: {
        id: paletaId,
        numer: paleta.numer_palety
      }
    });
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Error deleting pallet:', error);
    res.status(500).json({ 
      error: 'Błąd usuwania palety',
      message: error.message 
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * DELETE /api/pallets/zko/:zkoId/clear - Usuwanie wszystkich palet dla ZKO
 */
router.delete('/zko/:zkoId/clear', async (req: Request, res: Response) => {
  let client;
  
  try {
    const zkoId = parseInt(req.params.zkoId);
    
    if (isNaN(zkoId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO'
      });
    }
    
    client = await db.connect();
    await client.query('BEGIN');
    
    logger.info(`Clearing all pallets for ZKO ${zkoId}`);
    
    // Pobierz listę palet przed usunięciem
    const paletyResult = await client.query(
      'SELECT id, numer_palety FROM zko.palety WHERE zko_id = $1',
      [zkoId]
    );
    
    const paletyCount = paletyResult.rows.length;
    
    if (paletyCount === 0) {
      await client.query('ROLLBACK');
      return res.json({
        sukces: true,
        komunikat: 'Brak palet do usunięcia',
        usuniete: 0
      });
    }
    
    // Usuń powiązania z palety_formatki_ilosc
    await client.query(`
      DELETE FROM zko.palety_formatki_ilosc 
      WHERE paleta_id IN (
        SELECT id FROM zko.palety WHERE zko_id = $1
      )
    `, [zkoId]);
    
    // Usuń historię palet
    await client.query(`
      DELETE FROM zko.palety_historia 
      WHERE paleta_id IN (
        SELECT id FROM zko.palety WHERE zko_id = $1
      )
    `, [zkoId]);
    
    // Usuń palety
    await client.query(
      'DELETE FROM zko.palety WHERE zko_id = $1',
      [zkoId]
    );
    
    await client.query('COMMIT');
    
    // Emit event
    emitZKOUpdate(zkoId, 'pallets:cleared', {
      zko_id: zkoId,
      liczba_usunietych: paletyCount
    });
    
    logger.info(`Cleared ${paletyCount} pallets for ZKO ${zkoId}`);
    
    res.json({
      sukces: true,
      komunikat: `Usunięto wszystkie palety (${paletyCount})`,
      usuniete: paletyCount
    });
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Error clearing pallets:', error);
    res.status(500).json({ 
      error: 'Błąd usuwania palet',
      message: error.message 
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * POST /api/pallets/:id/close - Zamknięcie palety
 */
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = ClosePalletSchema.parse(req.body);
    
    logger.info(`Closing pallet ${id}`);
    
    const result = await db.query(
      `SELECT * FROM zko.pal_zamknij($1, $2, $3)`,
      [id, data.operator || null, data.uwagi || null]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      // Pobierz ZKO ID dla WebSocket
      const paletyResult = await db.query(
        'SELECT zko_id FROM zko.palety WHERE id = $1',
        [id]
      );
      
      if (paletyResult.rows.length > 0) {
        emitZKOUpdate(paletyResult.rows[0].zko_id, 'pallet:closed', {
          paleta_id: Number(id),
          paleta_info: response.paleta_info,
        });
      }
    }
    
    res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    logger.error('Error closing pallet:', error);
    res.status(500).json({ error: 'Failed to close pallet' });
  }
});

/**
 * PUT /api/pallets/reorganize - Reorganizacja palet
 */
router.put('/reorganize', async (req: Request, res: Response) => {
  try {
    const data = ReorganizePalletSchema.parse(req.body);
    
    logger.info('Reorganizing pallets:', data);
    
    const result = await db.query(
      `SELECT * FROM zko.pal_przesun_formatki($1, $2, $3, $4, $5, $6)`,
      [
        data.z_palety_id,
        data.na_palete_id,
        data.formatki_ids || null,
        null, // ilosc_sztuk
        data.operator || null,
        data.powod || null
      ]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      // Pobierz ZKO ID dla WebSocket
      const paletyResult = await db.query(
        'SELECT DISTINCT zko_id FROM zko.palety WHERE id IN ($1, $2)',
        [data.z_palety_id, data.na_palete_id]
      );
      
      if (paletyResult.rows.length > 0) {
        paletyResult.rows.forEach(row => {
          emitZKOUpdate(row.zko_id, 'pallets:reorganized', {
            z_palety_id: data.z_palety_id,
            na_palete_id: data.na_palete_id,
          });
        });
      }
    }
    
    res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    logger.error('Error reorganizing pallets:', error);
    res.status(500).json({ error: 'Failed to reorganize pallets' });
  }
});

/**
 * DELETE /api/pallets/empty/:pozycjaId - Usuwanie pustych palet
 */
router.delete('/empty/:pozycjaId', async (req: Request, res: Response) => {
  try {
    const { pozycjaId } = req.params;
    
    logger.info(`Cleaning empty pallets for position ${pozycjaId}`);
    
    const result = await db.query(
      `SELECT * FROM zko.pal_wyczysc_puste($1)`,
      [pozycjaId]
    );
    
    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error cleaning empty pallets:', error);
    res.status(500).json({ error: 'Failed to clean empty pallets' });
  }
});

export default router;
