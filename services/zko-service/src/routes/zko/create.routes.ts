import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import { logger } from './utils/logger';
import { handleError, validateSchema } from './utils/error-handler';
import { CreateZKOSchema } from './schemas';

const router = Router();

/**
 * POST /api/zko/create - Tworzenie nowego ZKO
 * Wywołuje funkcję PostgreSQL: zko.utworz_puste_zko
 */
router.post('/create', validateSchema(CreateZKOSchema), async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    logger.info('Creating new ZKO:', data);
    
    // Wywołanie funkcji PostgreSQL
    const result = await db.query(
      `SELECT * FROM zko.utworz_puste_zko($1, $2, $3, $4)`,
      [data.kooperant, data.priorytet, 'system', data.komentarz]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      // Emisja zdarzenia WebSocket
      emitZKOUpdate(response.zko_id, 'zko:created', {
        zko_id: response.zko_id,
        numer_zko: response.numer_zko,
      });
      logger.info('ZKO created successfully:', response);
    }
    
    res.json(response);
    
  } catch (error: any) {
    handleError(res, error, 'create ZKO');
  }
});

/**
 * DELETE /api/zko/delete/:id - Usunięcie całego ZKO
 * ZMIENIONA TRASA: z /:id na /delete/:id żeby nie konfliktowała z innymi
 * Wywołuje funkcję PostgreSQL: zko.usun_zko
 */
router.delete('/delete/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    logger.info(`Deleting entire ZKO ID: ${id}`);
    
    // Wywołanie funkcji PostgreSQL
    const result = await db.query(
      `SELECT * FROM zko.usun_zko($1)`,
      [id]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      // Emisja zdarzenia WebSocket
      emitZKOUpdate(Number(id), 'zko:deleted', {
        zko_id: Number(id),
      });
      logger.info('ZKO deleted successfully');
    }
    
    res.json(response);
    
  } catch (error: any) {
    handleError(res, error, 'delete ZKO');
  }
});

export default router;