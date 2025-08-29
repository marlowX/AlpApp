import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import pino from 'pino';
import { z } from 'zod';
import { PlanPalletsSchema, PlanPalletsForZKOSchema } from './schemas';

const router = Router();
const logger = pino();

/**
 * POST /api/pallets/plan - Planowanie palet dla pozycji
 * Wywołuje: zko.pal_planuj_inteligentnie_v3
 */
router.post('/plan', async (req: Request, res: Response) => {
  try {
    const data = PlanPalletsSchema.parse(req.body);
    
    logger.info('Planning pallets for position:', data);
    
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
      // Pobierz ZKO ID dla WebSocket
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    logger.error('Error planning pallets:', error);
    res.status(500).json({ error: 'Failed to plan pallets' });
  }
});

/**
 * POST /api/pallets/zko/:zkoId/plan - Planowanie palet dla całego ZKO
 * Wywołuje: zko.pal_planuj_inteligentnie_v4 lub v3 jako fallback
 */
router.post('/zko/:zkoId/plan', async (req: Request, res: Response) => {
  try {
    const { zkoId } = req.params;
    const data = PlanPalletsForZKOSchema.parse(req.body);
    
    logger.info(`Planning pallets for ZKO ${zkoId}:`, data);
    
    // Sprawdź czy ZKO ma pozycje
    const checkResult = await db.query(
      'SELECT COUNT(*) as count FROM zko.pozycje WHERE zko_id = $1',
      [zkoId]
    );
    
    if (parseInt(checkResult.rows[0].count) === 0) {
      return res.json({
        sukces: false,
        komunikat: 'Brak pozycji w ZKO. Najpierw dodaj pozycje z rozkrojami.'
      });
    }
    
    // Wywołaj funkcję PostgreSQL v4
    const result = await db.query(
      `SELECT * FROM zko.pal_planuj_inteligentnie_v4($1, $2, $3, $4)`,
      [zkoId, data.max_wysokosc_mm, data.max_formatek_na_palete, data.grubosc_plyty]
    );
    
    if (result.rows.length > 0) {
      emitZKOUpdate(Number(zkoId), 'pallets:planned', {
        zko_id: Number(zkoId),
        palety_utworzone: result.rows.length,
        strategia: data.strategia
      });
      
      res.json({
        sukces: true,
        komunikat: `Zaplanowano ${result.rows.length} palet`,
        palety: result.rows,
        parametry: data
      });
    } else {
      res.json({
        sukces: false,
        komunikat: 'Nie udało się zaplanować palet'
      });
    }
    
  } catch (error: any) {
    logger.error('Error planning pallets for ZKO:', error);
    res.status(500).json({ 
      error: 'Failed to plan pallets',
      message: error.message 
    });
  }
});

/**
 * GET /api/pallets/calculate - Obliczanie parametrów palety
 */
router.get('/calculate', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error('Error calculating pallet parameters:', error);
    res.status(500).json({ error: 'Failed to calculate parameters' });
  }
});

export default router;