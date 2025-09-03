import { Router, Request, Response } from 'express';
import { db } from '../../index';
import { logger } from './utils/logger';
import { handleError } from './utils/error-handler';

const router = Router();

/**
 * GET /api/zko/stats - Statystyki wszystkich ZKO
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching ZKO summary statistics');
    
    const query = `
      SELECT 
        COUNT(DISTINCT z.id) as total_zko,
        COUNT(DISTINCT p.id) as total_pozycje,
        COUNT(DISTINCT pal.id) as total_palety,
        SUM(pf.ilosc_planowana) as total_formatki,
        SUM(DISTINCT p.ilosc_plyt) as total_plyty,
        SUM(pal.waga_kg) as total_waga_kg,
        COUNT(DISTINCT CASE WHEN z.status = 'nowe' THEN z.id END) as zko_nowe,
        COUNT(DISTINCT CASE WHEN z.status = 'ZAKONCZONE' THEN z.id END) as zko_zakonczone,
        COUNT(DISTINCT CASE WHEN z.priorytet <= 2 THEN z.id END) as zko_pilne
      FROM zko.zlecenia z
      LEFT JOIN zko.pozycje p ON p.zko_id = z.id
      LEFT JOIN zko.pozycje_formatki pf ON pf.pozycja_id = p.id
      LEFT JOIN zko.palety pal ON pal.zko_id = z.id
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error: any) {
    handleError(res, error, 'fetch ZKO summary');
  }
});

/**
 * GET /api/zko/:id/stats - Statystyki pojedynczego ZKO
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching stats for ZKO ${id}`);
    
    const query = `
      SELECT 
        z.*,
        COUNT(DISTINCT p.id) as pozycje_count,
        COUNT(DISTINCT pal.id) as palety_count,
        COALESCE(SUM(pf.ilosc_planowana), 0) as formatki_total,
        COALESCE(SUM(pf.ilosc_wyprodukowana), 0) as formatki_wyprodukowane,
        COALESCE(SUM(p.ilosc_plyt), 0) as plyty_total,
        COALESCE(SUM(pal.waga_kg), 0) as waga_total,
        COALESCE(AVG(pal.wysokosc_cm), 0) as srednia_wysokosc_palet,
        json_agg(DISTINCT jsonb_build_object(
          'id', p.id,
          'kolor_plyty', p.kolor_plyty,
          'nazwa_plyty', p.nazwa_plyty,
          'ilosc_plyt', p.ilosc_plyt
        )) FILTER (WHERE p.id IS NOT NULL) as pozycje_summary,
        json_agg(DISTINCT jsonb_build_object(
          'id', pal.id,
          'numer_palety', pal.numer_palety,
          'status', pal.status,
          'waga_kg', pal.waga_kg,
          'wysokosc_cm', pal.wysokosc_cm
        )) FILTER (WHERE pal.id IS NOT NULL) as palety_summary
      FROM zko.zlecenia z
      LEFT JOIN zko.pozycje p ON p.zko_id = z.id
      LEFT JOIN zko.pozycje_formatki pf ON pf.pozycja_id = p.id
      LEFT JOIN zko.palety pal ON pal.zko_id = z.id
      WHERE z.id = $1
      GROUP BY z.id
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ZKO nie znalezione'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error: any) {
    handleError(res, error, 'fetch ZKO stats');
  }
});

/**
 * GET /api/zko/list-with-stats - Lista ZKO ze statystykami
 */
router.get('/list-with-stats', async (req: Request, res: Response) => {
  try {
    const { status, kooperant, priorytet, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    logger.info('Fetching ZKO list with statistics');
    
    // Zapytanie główne ze statystykami
    let query = `
      WITH zko_stats AS (
        SELECT 
          z.*,
          COUNT(DISTINCT p.id) as pozycje_count,
          COUNT(DISTINCT pal.id) as palety_count,
          COALESCE(SUM(pf.ilosc_planowana), 0) as formatki_total,
          COALESCE(SUM(pf.ilosc_wyprodukowana), 0) as formatki_wyprodukowane,
          COALESCE(SUM(p.ilosc_plyt), 0) as plyty_total,
          COALESCE(ROUND(SUM(pal.waga_kg)::numeric, 2), 0) as waga_total,
          CASE 
            WHEN COUNT(pf.id) > 0 
            THEN ROUND((SUM(pf.ilosc_wyprodukowana)::numeric / NULLIF(SUM(pf.ilosc_planowana), 0) * 100), 2)
            ELSE 0 
          END as procent_realizacji
        FROM zko.zlecenia z
        LEFT JOIN zko.pozycje p ON p.zko_id = z.id
        LEFT JOIN zko.pozycje_formatki pf ON pf.pozycja_id = p.id
        LEFT JOIN zko.palety pal ON pal.zko_id = z.id
        WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    // Filtry
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
    
    query += `
        GROUP BY z.id
      )
      SELECT *, COUNT(*) OVER() as total_count
      FROM zko_stats
      ORDER BY id DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(Number(limit), offset);
    
    const result = await db.query(query, params);
    
    const total = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const data = result.rows.map(row => {
      const { total_count, ...rest } = row;
      return rest;
    });
    
    logger.info(`Found ${data.length} ZKO with stats, total: ${total}`);
    
    res.json({ 
      success: true,
      data, 
      total 
    });
    
  } catch (error: any) {
    handleError(res, error, 'fetch ZKO list with stats');
  }
});

export default router;