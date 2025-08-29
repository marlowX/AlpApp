import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import pino from 'pino';
import { z } from 'zod';
import { ClosePalletSchema, ReorganizePalletSchema } from './schemas';

const router = Router();
const logger = pino();

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