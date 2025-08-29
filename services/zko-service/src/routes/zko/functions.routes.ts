import { Router, Request, Response } from 'express';
import { db } from '../../index';
import { logger } from './utils/logger';
import { handleError, validateSchema } from './utils/error-handler';
import { CallFunctionSchema } from './schemas';

const router = Router();

/**
 * POST /api/zko/functions - Wywołanie dowolnej funkcji PostgreSQL
 * Uniwersalny endpoint do wywołania funkcji ze schematu zko
 */
router.post('/functions', 
  validateSchema(CallFunctionSchema), 
  async (req: Request, res: Response) => {
    try {
      const { function: functionName, params } = req.body;
      
      logger.info(`Calling PostgreSQL function: ${functionName}`, { params });
      
      // Walidacja nazwy funkcji (bezpieczeństwo)
      if (!functionName.match(/^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/i)) {
        return res.status(400).json({
          error: 'Invalid function name format'
        });
      }
      
      // Przygotuj placeholdery
      const placeholders = params?.length 
        ? params.map((_, i) => `$${i + 1}`).join(', ')
        : '';
      
      const query = `SELECT * FROM ${functionName}(${placeholders})`;
      
      // Wykonaj zapytanie
      const result = await db.query(query, params || []);
      
      logger.info(`Function ${functionName} executed successfully`, {
        rowCount: result.rowCount
      });
      
      res.json({
        rows: result.rows,
        rowCount: result.rowCount
      });
      
    } catch (error: any) {
      handleError(res, error, 'call PostgreSQL function');
    }
  }
);

export default router;