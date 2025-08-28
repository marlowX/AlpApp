import { Router } from 'express';
import { db } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();

// GET /api/plyty - Lista płyt z public schema
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        nazwa,
        kolor_nazwa,
        grubosc,
        stan_magazynowy,
        cena_za_plyte,
        aktywna
      FROM public.plyty 
      WHERE aktywna = true 
      ORDER BY grubosc DESC, nazwa
    `);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching plyty:', error);
    res.status(500).json({ error: 'Failed to fetch plyty' });
  }
});

// GET /api/plyty/:id - Szczegóły płyty
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        id,
        nazwa,
        kolor_nazwa,
        grubosc,
        stan_magazynowy,
        cena_za_plyte,
        aktywna
      FROM public.plyty 
      WHERE id = $1 AND aktywna = true
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Płyta not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching płyta:', error);
    res.status(500).json({ error: 'Failed to fetch płyta' });
  }
});

export default router;