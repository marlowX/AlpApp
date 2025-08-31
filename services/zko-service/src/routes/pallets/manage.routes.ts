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
 * DELETE /api/pallets/:id/clear-formatki - Wyczyść wszystkie formatki z palety
 * NOWY ENDPOINT dla edycji palety
 */
router.delete('/:id/clear-formatki', async (req: Request, res: Response) => {
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
    
    logger.info(`Clearing formatki from pallet ${paletaId}`);
    
    // Usuń wszystkie formatki z palety
    await client.query(
      'DELETE FROM zko.palety_formatki_ilosc WHERE paleta_id = $1',
      [paletaId]
    );
    
    // Zaktualizuj paletę
    await client.query(`
      UPDATE zko.palety 
      SET 
        formatki_ids = ARRAY[]::integer[],
        ilosc_formatek = 0,
        wysokosc_stosu = 0,
        waga_kg = 0,
        updated_at = NOW()
      WHERE id = $1
    `, [paletaId]);
    
    await client.query('COMMIT');
    
    logger.info(`Cleared formatki from pallet ${paletaId}`);
    
    res.json({
      sukces: true,
      komunikat: 'Formatki zostały usunięte z palety'
    });
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Error clearing formatki:', error);
    res.status(500).json({ 
      error: 'Błąd czyszczenia palety',
      message: error.message 
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * POST /api/pallets/:id/update-formatki - Aktualizuj formatki na palecie
 * TYMCZASOWE OBEJŚCIE - wykonuje operacje bezpośrednio zamiast wywołać funkcję PostgreSQL
 */
router.post('/:id/update-formatki', async (req: Request, res: Response) => {
  let client;
  
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
    
    logger.info(`Updating pallet ${paletaId} using direct SQL`, { 
      formatki_count: formatki.length,
      przeznaczenie 
    });
    
    client = await db.connect();
    await client.query('BEGIN');
    
    // Pobierz dane palety
    const paletaResult = await client.query(
      'SELECT * FROM zko.palety WHERE id = $1',
      [paletaId]
    );
    
    if (paletaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({
        sukces: false,
        komunikat: `Paleta o ID ${paletaId} nie istnieje`
      });
    }
    
    const paleta = paletaResult.rows[0];
    
    // 1. Usuń stare formatki
    await client.query(
      'DELETE FROM zko.palety_formatki_ilosc WHERE paleta_id = $1',
      [paletaId]
    );
    
    let totalWaga = 0;
    let totalWysokosc = 0;
    let totalSztuk = 0;
    let formatkiIds = [];
    
    // 2. Dodaj nowe formatki jeśli są
    for (const formatka of formatki) {
      if (formatka.ilosc > 0) {
        // Pobierz dane formatki
        const formatkaDataResult = await client.query(`
          SELECT 
            pf.id,
            pf.waga_sztuka,
            COALESCE(poz.grubosc_plyty, 18) as grubosc,
            pf.nazwa_formatki,
            poz.kolor_plyty
          FROM zko.pozycje_formatki pf
          LEFT JOIN zko.pozycje poz ON poz.id = pf.pozycja_id
          WHERE pf.id = $1
        `, [formatka.formatka_id]);
        
        if (formatkaDataResult.rows.length > 0) {
          const formatkaData = formatkaDataResult.rows[0];
          
          // Dodaj do tabeli palety_formatki_ilosc
          await client.query(`
            INSERT INTO zko.palety_formatki_ilosc (paleta_id, formatka_id, ilosc)
            VALUES ($1, $2, $3)
          `, [paletaId, formatka.formatka_id, formatka.ilosc]);
          
          // Aktualizuj statystyki
          formatkiIds.push(formatka.formatka_id);
          totalSztuk += formatka.ilosc;
          totalWaga += (formatkaData.waga_sztuka || 0) * formatka.ilosc;
          
          // Oblicz wysokość (4 sztuki na poziom)
          const wysokosc = Math.ceil(formatka.ilosc / 4) * formatkaData.grubosc;
          totalWysokosc = Math.max(totalWysokosc, wysokosc);
          
          logger.info(`Added formatka ${formatkaData.nazwa_formatki}: ${formatka.ilosc} pcs, color: ${formatkaData.kolor_plyty}`);
        }
      }
    }
    
    // 3. Zaktualizuj paletę
    await client.query(`
      UPDATE zko.palety
      SET 
        formatki_ids = $1,
        ilosc_formatek = $2,
        wysokosc_stosu = $3,
        waga_kg = $4,
        przeznaczenie = COALESCE($5, przeznaczenie),
        uwagi = CASE WHEN $6 IS NOT NULL THEN $6 ELSE uwagi END,
        updated_at = NOW()
      WHERE id = $7
    `, [
      formatkiIds.length > 0 ? formatkiIds : null,
      totalSztuk,
      totalWysokosc,
      totalWaga,
      przeznaczenie,
      uwagi,
      paletaId
    ]);
    
    // 4. Dodaj wpis do historii
    await client.query(`
      INSERT INTO zko.palety_historia (
        paleta_id,
        zko_id,
        akcja,
        operator,
        opis_zmiany,
        stan_po,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      paletaId,
      paleta.zko_id,
      'EDYCJA',
      'user',
      `Edycja palety - ${totalSztuk} formatek`,
      JSON.stringify({
        formatki_count: totalSztuk,
        waga_kg: totalWaga,
        wysokosc_mm: totalWysokosc,
        przeznaczenie: przeznaczenie || paleta.przeznaczenie,
        uwagi: uwagi
      })
    ]);
    
    await client.query('COMMIT');
    
    const response = {
      sukces: true,
      komunikat: totalSztuk > 0 
        ? `Paleta ${paleta.numer_palety} zaktualizowana: ${totalSztuk} szt. w ${formatkiIds.length} typach`
        : `Paleta ${paleta.numer_palety} zaktualizowana (pusta)`,
      paleta_id: paletaId,
      numer_palety: paleta.numer_palety,
      sztuk_total: totalSztuk,
      typy_formatek: formatkiIds.length,
      waga_kg: totalWaga,
      wysokosc_mm: totalWysokosc,
      przeznaczenie: przeznaczenie || paleta.przeznaczenie,
      zko_id: paleta.zko_id
    };
    
    // Emit WebSocket event
    if (paleta.zko_id) {
      emitZKOUpdate(paleta.zko_id, 'pallet:updated', {
        paleta_id: paletaId,
        numer_palety: paleta.numer_palety,
        formatki_count: totalSztuk,
        przeznaczenie: przeznaczenie || paleta.przeznaczenie
      });
    }
    
    logger.info(`Successfully updated pallet ${paletaId}`, response);
    res.json(response);
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Error updating pallet:', error);
    res.status(500).json({ 
      error: 'Błąd aktualizacji palety',
      message: error.message,
      details: error.stack
    });
  } finally {
    if (client) {
      client.release();
    }
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

export default router;