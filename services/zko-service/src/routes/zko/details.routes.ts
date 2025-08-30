import { Router, Request, Response } from 'express';
import { db } from '../../index';
import { logger } from './utils/logger';
import { handleError } from './utils/error-handler';

const router = Router();

/**
 * GET /api/zko/:id - Szczegóły ZKO
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    logger.info(`Fetching ZKO details for ID: ${id}`);
    
    // Pobierz dane ZKO
    const zkoResult = await db.query(
      'SELECT * FROM zko.zlecenia WHERE id = $1',
      [id]
    );
    
    if (zkoResult.rows.length === 0) {
      logger.warn(`ZKO not found with ID: ${id}`);
      return res.status(404).json({ error: 'ZKO not found' });
    }
    
    const zko = zkoResult.rows[0];
    
    // Pobierz pozycje z rozkrojami
    const pozycjeResult = await db.query(`
      SELECT 
        p.*,
        r.kod_rozkroju,
        r.opis as rozkroj_opis
      FROM zko.pozycje p
      LEFT JOIN zko.rozkroje r ON p.rozkroj_id = r.id
      WHERE p.zko_id = $1 
      ORDER BY p.kolejnosc
    `, [id]);
    
    // Pobierz palety
    const paletyResult = await db.query(
      'SELECT * FROM zko.palety WHERE zko_id = $1 ORDER BY id',
      [id]
    );
    
    logger.info(`Found ZKO with ${pozycjeResult.rows.length} positions and ${paletyResult.rows.length} pallets`);
    
    // Zwróć kompletne dane
    res.json({
      ...zko,
      pozycje: pozycjeResult.rows,
      palety: paletyResult.rows,
    });
    
  } catch (error: any) {
    handleError(res, error, 'fetch ZKO details');
  }
});

/**
 * GET /api/zko/:id/pozycje - Pozycje ZKO z pełnymi danymi
 */
router.get('/:id/pozycje', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    logger.info(`Fetching positions for ZKO ID: ${id}`);
    
    // Pobierz pozycje z pełnymi danymi o formatkach
    const result = await db.query(`
      SELECT 
        p.id as pozycja_id,
        p.id,
        p.rozkroj_id,
        r.kod_rozkroju,
        r.opis as rozkroj_opis,
        p.kolor_plyty,
        p.nazwa_plyty,
        p.ilosc_plyt,
        COUNT(DISTINCT pf.id) as typy_formatek,
        SUM(pf.ilosc_planowana) as sztuk_formatek
      FROM zko.pozycje p
      LEFT JOIN zko.rozkroje r ON r.id = p.rozkroj_id
      LEFT JOIN zko.pozycje_formatki pf ON pf.pozycja_id = p.id
      WHERE p.zko_id = $1
      GROUP BY p.id, p.rozkroj_id, r.kod_rozkroju, r.opis, p.kolor_plyty, p.nazwa_plyty, p.ilosc_plyt
      ORDER BY p.id
    `, [id]);
    
    logger.info(`Found ${result.rows.length} positions for ZKO ${id}`);
    
    res.json({
      sukces: true,
      pozycje: result.rows,
      total: result.rows.length
    });
    
  } catch (error: any) {
    handleError(res, error, 'fetch ZKO positions');
  }
});

/**
 * GET /api/zko/:id/status - Status zlecenia
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT * FROM zko.pokaz_status_zko($1)`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ZKO not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error: any) {
    handleError(res, error, 'fetch ZKO status');
  }
});

/**
 * GET /api/zko/:id/next-steps - Następne kroki workflow
 */
router.get('/:id/next-steps', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT * FROM zko.pobierz_nastepne_etapy($1)`,
      [id]
    );
    
    res.json(result.rows);
    
  } catch (error: any) {
    handleError(res, error, 'fetch next steps');
  }
});

export default router;