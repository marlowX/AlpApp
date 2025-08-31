import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import pino from 'pino';
import { z } from 'zod';
import { ClosePalletSchema, ReorganizePalletSchema } from './schemas';

const router = Router();
const logger = pino();

/**
 * GET /api/pallets/:id - Pobieranie szczegółów pojedynczej palety
 * NOWY ENDPOINT dla edycji palety
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
 * GET /api/pallets/zko/:zkoId - Pobieranie palet dla ZKO
 * Zwraca listę palet z formatkami
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
    
    if (isNaN(paletaId)) {  // POPRAWIONE: isNaN zamiast isNan
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
 * Wywołuje: zko.pal_zamknij
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
 * Wywołuje: zko.pal_przesun_formatki
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
 * Wywołuje: zko.pal_wyczysc_puste
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

/**
 * POST /api/pallets/zko/:zkoId/change-quantity - Zmiana ilości palet
 * Reorganizuje formatki na nową ilość palet
 */
router.post('/zko/:zkoId/change-quantity', async (req: Request, res: Response) => {
  let client;
  
  try {
    const zkoId = parseInt(req.params.zkoId);
    const { nowa_ilosc } = req.body;
    
    if (isNaN(zkoId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO',
        details: 'ID ZKO musi być liczbą'
      });
    }
    
    if (!nowa_ilosc || nowa_ilosc < 1 || nowa_ilosc > 50) {
      return res.status(400).json({
        error: 'Nieprawidłowa ilość palet',
        details: 'Ilość musi być między 1 a 50'
      });
    }
    
    client = await db.connect();
    await client.query('BEGIN');
    
    logger.info(`Changing pallet quantity for ZKO ${zkoId} to ${nowa_ilosc}`);
    
    // Pobierz obecne palety
    const currentPallets = await client.query(
      'SELECT * FROM zko.palety WHERE zko_id = $1 ORDER BY id',
      [zkoId]
    );
    
    const currentCount = currentPallets.rows.length;
    
    if (currentCount === nowa_ilosc) {
      await client.query('ROLLBACK');
      return res.json({
        sukces: true,
        komunikat: 'Ilość palet jest już taka sama',
        palety: currentPallets.rows
      });
    }
    
    // Pobierz info o ZKO
    const zkoInfo = await client.query(
      'SELECT numer_zko FROM zko.zlecenia WHERE id = $1',
      [zkoId]
    );
    
    if (zkoInfo.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ZKO nie znalezione' });
    }
    
    const numerZko = zkoInfo.rows[0].numer_zko;
    
    // Zbierz wszystkie formatki z obecnych palet
    const allFormatkiIds = [];
    for (const pallet of currentPallets.rows) {
      if (pallet.formatki_ids && Array.isArray(pallet.formatki_ids)) {
        allFormatkiIds.push(...pallet.formatki_ids);
      }
    }
    
    // Usuń obecne palety
    await client.query('DELETE FROM zko.palety WHERE zko_id = $1', [zkoId]);
    
    // Utwórz nowe palety
    const newPallets = [];
    for (let i = 0; i < nowa_ilosc; i++) {
      const result = await client.query(
        `INSERT INTO zko.palety (
          zko_id, 
          numer_palety, 
          kierunek, 
          status,
          typ_palety,
          formatki_ids,
          ilosc_formatek,
          wysokosc_stosu,
          waga_kg
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          zkoId,
          `PAL-${numerZko}-${String(i + 1).padStart(3, '0')}`,
          'wewnetrzny',
          'otwarta',
          'EURO',
          [], // Puste na początku
          0,
          0,
          0
        ]
      );
      newPallets.push(result.rows[0]);
    }
    
    // Rozdziel formatki równomiernie na nowe palety
    if (allFormatkiIds.length > 0) {
      const formatkiPerPallet = Math.ceil(allFormatkiIds.length / nowa_ilosc);
      
      for (let i = 0; i < nowa_ilosc; i++) {
        const startIdx = i * formatkiPerPallet;
        const endIdx = Math.min(startIdx + formatkiPerPallet, allFormatkiIds.length);
        const palletFormatki = allFormatkiIds.slice(startIdx, endIdx);
        
        if (palletFormatki.length > 0) {
          await client.query(
            `UPDATE zko.palety 
             SET formatki_ids = $1,
                 ilosc_formatek = $2,
                 wysokosc_stosu = $3
             WHERE id = $4`,
            [
              palletFormatki,
              palletFormatki.length,
              palletFormatki.length * 18, // Zakładamy 18mm grubość
              newPallets[i].id
            ]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Pobierz zaktualizowane palety
    const updatedPallets = await db.query(
      'SELECT * FROM zko.palety WHERE zko_id = $1 ORDER BY id',
      [zkoId]
    );
    
    // Emit event
    emitZKOUpdate(zkoId, 'pallets:reorganized', {
      zko_id: zkoId,
      nowa_ilosc: nowa_ilosc,
      poprzednia_ilosc: currentCount
    });
    
    logger.info(`Changed pallet quantity from ${currentCount} to ${nowa_ilosc} for ZKO ${zkoId}`);
    
    res.json({
      sukces: true,
      komunikat: `Zmieniono ilość palet z ${currentCount} na ${nowa_ilosc}`,
      palety: updatedPallets.rows
    });
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Error changing pallet quantity:', error);
    res.status(500).json({ 
      error: 'Błąd zmiany ilości palet',
      message: error.message 
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

export default router;