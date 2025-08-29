import { Router, Request, Response } from 'express';
import { db } from '../../index';
import pino from 'pino';

const router = Router();
const logger = pino();

/**
 * GET /api/pallets/rules - Lista reguł planowania
 * Używa widoku: zko_config.v_reguly_planowania
 */
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT * FROM zko_config.v_reguly_planowania
      ORDER BY priorytet
    `);
    
    res.json({
      reguly: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    logger.error('Error fetching pallet rules:', error);
    res.status(500).json({ error: 'Failed to fetch pallet rules' });
  }
});

/**
 * GET /api/pallets/rules/:id - Szczegóły reguły
 */
router.get('/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const ruleResult = await db.query(
      'SELECT * FROM zko_config.reguly_planowania_palet WHERE id = $1',
      [id]
    );
    
    if (ruleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    const examplesResult = await db.query(
      'SELECT * FROM zko_config.reguly_przykladowe_przypadki WHERE regula_id = $1',
      [id]
    );
    
    res.json({
      regula: ruleResult.rows[0],
      przyklady: examplesResult.rows
    });
  } catch (error: any) {
    logger.error('Error fetching rule details:', error);
    res.status(500).json({ error: 'Failed to fetch rule details' });
  }
});

/**
 * POST /api/pallets/rules/test - Testuj regułę dla pozycji
 */
router.post('/rules/test', async (req: Request, res: Response) => {
  try {
    const { pozycja_id } = req.body;
    
    if (!pozycja_id) {
      return res.status(400).json({ error: 'pozycja_id is required' });
    }
    
    // Analizuj pozycję
    const analizaResult = await db.query(
      'SELECT * FROM zko_config.analizuj_pozycje_dla_palet($1)',
      [pozycja_id]
    );
    
    if (analizaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    const analiza = analizaResult.rows[0];
    
    // Wybierz odpowiednią regułę
    const regulaResult = await db.query(
      `SELECT * FROM zko_config.wybierz_regule_planowania($1, $2, $3, $4)`,
      [
        analiza.liczba_kolorow,
        analiza.kierunki,
        analiza.typy_formatek,
        analiza.ilosc_formatek
      ]
    );
    
    res.json({
      analiza_pozycji: analiza,
      wybrana_regula: regulaResult.rows[0],
      rekomendacja: {
        liczba_palet: regulaResult.rows[0]?.liczba_palet || 1,
        strategia: regulaResult.rows[0]?.strategia_grupowania || 'po_kolorze',
        opis: regulaResult.rows[0]?.opis_reguly || 'Brak dopasowanej reguły'
      }
    });
  } catch (error: any) {
    logger.error('Error testing rules:', error);
    res.status(500).json({ error: 'Failed to test rules' });
  }
});

export default router;