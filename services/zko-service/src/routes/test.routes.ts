import { Router } from 'express';
import { db } from '../index';
import pino from 'pino';

const router: Router = Router();
const logger = pino();

// GET /api/test/connection - Test połączenia z bazą
router.get('/connection', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time, current_database() as database');
    res.json({
      status: 'connected',
      database: result.rows[0].database,
      time: result.rows[0].current_time
    });
  } catch (error: any) {
    logger.error('Database connection test failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET /api/test/schema - Test dostępu do schematu zko
router.get('/schema', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM zko.zlecenia) as zlecenia_count
      FROM information_schema.tables 
      WHERE table_schema = 'zko' 
      LIMIT 5
    `);
    res.json({
      status: 'success',
      tables: result.rows
    });
  } catch (error: any) {
    logger.error('Schema test failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      detail: error.detail
    });
  }
});

// GET /api/test/zko - Test pobierania ZKO
router.get('/zko', async (req, res) => {
  try {
    logger.info('Testing ZKO query...');

    const result = await db.query(`
      SELECT 
        id,
        numer_zko,
        kooperant,
        status,
        priorytet,
        data_utworzenia
      FROM zko.zlecenia 
      ORDER BY id DESC 
      LIMIT 5
    `);

    logger.info(`Found ${result.rows.length} ZKO records`);

    res.json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    logger.error('ZKO test query failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  }
});

export default router;