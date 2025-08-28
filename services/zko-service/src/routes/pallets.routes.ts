import { Router } from 'express';
import { z } from 'zod';
import { db, emitZKOUpdate } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();

// Validation schemas
const PlanPalletsSchema = z.object({
  pozycja_id: z.number(),
  max_wysokosc_cm: z.number().default(180),
  max_waga_kg: z.number().default(700),
  grubosc_mm: z.number().default(18),
});

const ClosePalletSchema = z.object({
  operator: z.string().optional(),
  uwagi: z.string().optional(),
});

const ReorganizePalletSchema = z.object({
  z_palety_id: z.number(),
  na_palete_id: z.number(),
  formatki_ids: z.array(z.number()).optional(),
  operator: z.string().optional(),
  powod: z.string().optional(),
});

// POST /api/pallets/plan - Planowanie palet
router.post('/plan', async (req, res) => {
  try {
    const data = PlanPalletsSchema.parse(req.body);
    
    const result = await db.query(
      `SELECT * FROM zko.pal_planuj_inteligentnie_v3($1, $2, $3, $4, $5)`,
      [
        data.pozycja_id,
        null, // operator
        data.max_wysokosc_cm,
        data.max_waga_kg,
        data.grubosc_mm
      ]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      // Get ZKO ID for WebSocket
      const zkoResult = await db.query(
        'SELECT zko_id FROM zko.pozycje WHERE id = $1',
        [data.pozycja_id]
      );
      
      if (zkoResult.rows.length > 0) {
        emitZKOUpdate(zkoResult.rows[0].zko_id, 'pallets:planned', {
          pozycja_id: data.pozycja_id,
          palety_utworzone: response.palety_utworzone,
        });
      }
    }
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error planning pallets:', error);
    res.status(500).json({ error: 'Failed to plan pallets' });
  }
});

// GET /api/pallets/calculate - Obliczanie parametrów
router.get('/calculate', async (req, res) => {
  try {
    const { pozycja_id, formatki_ids, max_wysokosc, max_waga } = req.query;
    
    if (!pozycja_id) {
      return res.status(400).json({ error: 'pozycja_id is required' });
    }
    
    const formatki = formatki_ids ? 
      (Array.isArray(formatki_ids) ? formatki_ids : [formatki_ids]).map(Number) : 
      null;
    
    const result = await db.query(
      `SELECT * FROM zko.pal_oblicz_parametry_v4($1, $2, $3, $4)`,
      [
        Number(pozycja_id),
        formatki,
        max_wysokosc ? Number(max_wysokosc) : 180,
        max_waga ? Number(max_waga) : 700
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error calculating pallet parameters:', error);
    res.status(500).json({ error: 'Failed to calculate pallet parameters' });
  }
});

// POST /api/pallets/:id/close - Zamknięcie palety
router.post('/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const data = ClosePalletSchema.parse(req.body);
    
    const result = await db.query(
      `SELECT * FROM zko.pal_zamknij($1, $2, $3)`,
      [id, data.operator || null, data.uwagi || null]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      // Get ZKO ID for WebSocket
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error closing pallet:', error);
    res.status(500).json({ error: 'Failed to close pallet' });
  }
});

// PUT /api/pallets/reorganize - Reorganizacja palet
router.put('/reorganize', async (req, res) => {
  try {
    const data = ReorganizePalletSchema.parse(req.body);
    
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
      // Get ZKO ID for WebSocket
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error reorganizing pallets:', error);
    res.status(500).json({ error: 'Failed to reorganize pallets' });
  }
});

// GET /api/pallets/zko/:zkoId - Lista palet dla ZKO
router.get('/zko/:zkoId', async (req, res) => {
  try {
    const { zkoId } = req.params;
    
    const result = await db.query(
      `SELECT p.*, sp.nazwa as status_nazwa, sp.opis as status_opis
       FROM zko.palety p
       LEFT JOIN zko.statusy_palet sp ON p.status = sp.kod_statusu
       WHERE p.zko_id = $1
       ORDER BY p.id`,
      [zkoId]
    );
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching pallets for ZKO:', error);
    res.status(500).json({ error: 'Failed to fetch pallets' });
  }
});

// DELETE /api/pallets/empty/:pozycjaId - Usuwanie pustych palet
router.delete('/empty/:pozycjaId', async (req, res) => {
  try {
    const { pozycjaId } = req.params;
    
    const result = await db.query(
      `SELECT * FROM zko.pal_wyczysc_puste($1)`,
      [pozycjaId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error cleaning empty pallets:', error);
    res.status(500).json({ error: 'Failed to clean empty pallets' });
  }
});

export default router;
