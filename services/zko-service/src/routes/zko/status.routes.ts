import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import { logger } from './utils/logger';
import { handleError, validateSchema } from './utils/error-handler';
import { ChangeStatusSchema } from './schemas';

const router = Router();

/**
 * POST /api/zko/status/change - Zmiana statusu
 * Wywołuje funkcję PostgreSQL: zko.zmien_status_v3
 */
router.post('/status/change', 
  validateSchema(ChangeStatusSchema), 
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      
      logger.info('Changing ZKO status:', data);
      
      // Wywołanie funkcji PostgreSQL
      const result = await db.query(
        `SELECT * FROM zko.zmien_status_v3($1, $2, $3, $4, $5, $6)`,
        [
          data.zko_id,
          data.nowy_etap_kod,
          'system',
          data.komentarz || null,
          data.operator || null,
          data.lokalizacja || null
        ]
      );
      
      const response = result.rows[0];
      
      if (response.sukces) {
        // Emisja zdarzenia WebSocket
        emitZKOUpdate(data.zko_id, 'zko:status:changed', {
          zko_id: data.zko_id,
          stary_status: response.stary_status,
          nowy_status: response.nowy_status,
        });
        logger.info('Status changed successfully');
      }
      
      res.json(response);
      
    } catch (error: any) {
      handleError(res, error, 'change status');
    }
  }
);

export default router;