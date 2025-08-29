import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import { logger } from './utils/logger';
import { handleError, validateSchema } from './utils/error-handler';
import { CompleteZKOSchema } from './schemas';

const router = Router();

/**
 * POST /api/zko/:id/complete - Zakończenie zlecenia
 * Wywołuje funkcję PostgreSQL: zko.zakoncz_zlecenie
 */
router.post('/:id/complete', 
  validateSchema(CompleteZKOSchema), 
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { operator, komentarz } = req.body;
      
      logger.info(`Completing ZKO ID: ${id}`, { operator, komentarz });
      
      // Wywołanie funkcji PostgreSQL
      const result = await db.query(
        `SELECT * FROM zko.zakoncz_zlecenie($1, $2, $3)`,
        [id, operator || null, komentarz || null]
      );
      
      const response = result.rows[0];
      
      if (response.sukces) {
        // Emisja zdarzenia WebSocket
        emitZKOUpdate(Number(id), 'zko:completed', {
          zko_id: Number(id),
          podsumowanie: response.podsumowanie,
        });
        logger.info('ZKO completed successfully');
      }
      
      res.json(response);
      
    } catch (error: any) {
      handleError(res, error, 'complete ZKO');
    }
  }
);

export default router;