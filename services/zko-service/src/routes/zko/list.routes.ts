import { Router, Request, Response } from 'express';
import { db } from '../../index';
import { logger } from './utils/logger';
import { handleError } from './utils/error-handler';

const router = Router();

/**
 * GET /api/zko - Lista ZKO z filtrowaniem i paginacją
 * Maksymalnie 300 linii w pliku!
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, kooperant, priorytet, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    logger.info('Fetching ZKO list with params:', { 
      status, kooperant, priorytet, page, limit 
    });
    
    // Budowanie zapytania SQL
    let query = `
      SELECT z.*, COUNT(*) OVER() as total_count
      FROM zko.zlecenia z
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    // Dodawanie filtrów
    if (status) {
      query += ` AND z.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (kooperant) {
      query += ` AND z.kooperant ILIKE $${paramCount}`;
      params.push(`%${kooperant}%`);
      paramCount++;
    }
    
    if (priorytet) {
      query += ` AND z.priorytet = $${paramCount}`;
      params.push(Number(priorytet));
      paramCount++;
    }
    
    // Sortowanie i paginacja
    query += ` ORDER BY z.id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);
    
    logger.debug('Executing query:', { query, params });
    
    // Wykonanie zapytania
    const result = await db.query(query, params);
    
    // Przetworzenie wyników
    const total = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const data = result.rows.map(row => {
      const { total_count, ...rest } = row;
      return rest;
    });
    
    logger.info(`Found ${data.length} ZKO records, total: ${total}`);
    
    res.json({ data, total });
    
  } catch (error: any) {
    handleError(res, error, 'fetch ZKO list');
  }
});

export default router;