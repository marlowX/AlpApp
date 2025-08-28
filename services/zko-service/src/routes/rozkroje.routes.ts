import { Router } from 'express';
import { db } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();

// GET /api/rozkroje - Lista rozkrojów
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, 
        kod_rozkroju, 
        opis, 
        rozmiar_plyty,
        ilosc_typow_formatek,
        procent_wykorzystania,
        created_at
      FROM zko.rozkroje 
      WHERE aktywny = true 
      ORDER BY kod_rozkroju
    `);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching rozkroje:', error);
    res.status(500).json({ error: 'Failed to fetch rozkroje' });
  }
});

// GET /api/rozkroje/:id - Szczegóły rozkroju
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        id, 
        kod_rozkroju, 
        opis, 
        rozmiar_plyty,
        ilosc_typow_formatek,
        procent_wykorzystania,
        created_at
      FROM zko.rozkroje 
      WHERE id = $1 AND aktywny = true
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rozkrój not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching rozkrój:', error);
    res.status(500).json({ error: 'Failed to fetch rozkrój' });
  }
});

// GET /api/rozkroje/:id/formatki - Formatki w rozkroju
router.get('/:id/formatki', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        rf.id,
        rf.pozycja,
        rf.nazwa_formatki,
        rf.dlugosc,
        rf.szerokosc,
        rf.ilosc_sztuk,
        rf.typ_formatki,
        rf.typ_plyty,
        rf.wymaga_oklejania,
        rf.wymaga_wiercenia,
        rf.sciezka_produkcji,
        rf.obrzeze_config
      FROM zko.rozkroje_formatki rf
      WHERE rf.rozkroj_id = $1
      ORDER BY rf.pozycja, rf.nazwa_formatki
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching formatki for rozkroj:', error);
    res.status(500).json({ error: 'Failed to fetch formatki' });
  }
});

export default router;