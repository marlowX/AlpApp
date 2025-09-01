import { Router, Request, Response } from 'express';
import { db } from '../../index';
import { logger } from './utils/logger';
import { handleError } from './utils/error-handler';

const router = Router();

/**
 * GET /api/zko/kooperanci - Lista aktywnych kooperantów
 * Wywołuje funkcję PostgreSQL: zko.pobierz_kooperantow_lista
 */
router.get('/kooperanci', async (_req: Request, res: Response) => {
  try {
    logger.info('Fetching kooperanci list');
    
    const result = await db.query(
      `SELECT * FROM zko.pobierz_kooperantow_lista()`
    );
    
    logger.info(`Found ${result.rows.length} kooperanci`);
    res.json(result.rows);
    
  } catch (error: any) {
    handleError(res, error, 'fetch kooperanci');
  }
});

/**
 * GET /api/zko/kooperanci/:id - Szczegóły kooperanta
 */
router.get('/kooperanci/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching kooperant details for ID: ${id}`);
    
    const result = await db.query(
      `SELECT k.*, 
              COUNT(DISTINCT h.id) as liczba_zlecen,
              COALESCE(SUM(h.ilosc_formatek), 0) as suma_formatek,
              COALESCE(AVG(h.ocena_jakosci), 0) as srednia_ocena_jakosci
       FROM zko.kooperanci k
       LEFT JOIN zko.kooperanci_historia h ON k.id = h.kooperant_id
       WHERE k.id = $1
       GROUP BY k.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Kooperant not found' 
      });
    }
    
    res.json(result.rows[0]);
    
  } catch (error: any) {
    handleError(res, error, 'fetch kooperant details');
  }
});

/**
 * GET /api/zko/kooperanci/:id/historia - Historia współpracy
 */
router.get('/kooperanci/:id/historia', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching historia for kooperant ID: ${id}`);
    
    const result = await db.query(
      `SELECT h.*, z.numer_zko as aktualny_numer_zko
       FROM zko.kooperanci_historia h
       LEFT JOIN zko.zlecenia z ON h.zko_id = z.id
       WHERE h.kooperant_id = $1
       ORDER BY h.data_zlecenia DESC`,
      [id]
    );
    
    logger.info(`Found ${result.rows.length} historia records`);
    res.json(result.rows);
    
  } catch (error: any) {
    handleError(res, error, 'fetch kooperant historia');
  }
});

/**
 * GET /api/zko/kooperanci/:id/cennik - Cennik kooperanta
 */
router.get('/kooperanci/:id/cennik', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching cennik for kooperant ID: ${id}`);
    
    const result = await db.query(
      `SELECT * FROM zko.kooperanci_cennik
       WHERE kooperant_id = $1 AND aktywny = true
       ORDER BY typ_uslugi, data_od DESC`,
      [id]
    );
    
    logger.info(`Found ${result.rows.length} cennik records`);
    res.json(result.rows);
    
  } catch (error: any) {
    handleError(res, error, 'fetch kooperant cennik');
  }
});

export default router;