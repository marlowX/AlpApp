import { Router } from 'express';
import { db } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();

// GET /api/plyty - Lista płyt posortowana według popularności
router.get('/plyty', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id,
        p.nazwa,
        p.kolor_nazwa,
        p.grubosc,
        p.dlugosc,
        p.szerokosc,
        p.stan_magazynowy,
        p.cena_za_plyte,
        p.gestosc_kg_m3,
        p.opis
      FROM public.plyty p
      WHERE p.aktywna = true
      ORDER BY 
        CASE p.kolor_nazwa
          WHEN 'WOTAN' THEN 1
          WHEN 'BIALY' THEN 2
          WHEN 'CZARNY' THEN 3
          WHEN 'LANCELOT' THEN 4
          WHEN 'SONOMA' THEN 5
          WHEN 'ARTISAN' THEN 6
          WHEN 'SUROWA' THEN 7
          ELSE 99
        END,
        p.kolor_nazwa,
        p.grubosc,
        p.nazwa
    `);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching plyty:', error);
    res.status(500).json({ error: 'Failed to fetch plyty' });
  }
});

// GET /api/rozkroje - Lista rozkrojów z wyszukiwaniem
router.get('/rozkroje', async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        r.id,
        r.kod_rozkroju,
        r.opis,
        r.rozmiar_plyty,
        r.ilosc_typow_formatek,
        r.procent_wykorzystania
      FROM zko.rozkroje r
      WHERE r.aktywny = true
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (search) {
      query += ` AND (
        r.kod_rozkroju ILIKE $${paramCount} OR 
        r.opis ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` ORDER BY r.id DESC LIMIT 50`;
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching rozkroje:', error);
    res.status(500).json({ error: 'Failed to fetch rozkroje' });
  }
});

// GET /api/rozkroje/:id/formatki - Formatki dla rozkroju
router.get('/rozkroje/:id/formatki', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        rf.id,
        rf.pozycja,
        rf.dlugosc,
        rf.szerokosc,
        rf.nazwa_formatki,
        rf.ilosc_sztuk,
        rf.typ_formatki,
        rf.wymaga_oklejania,
        rf.wymaga_wiercenia,
        rf.obrzeze_config,
        rf.uwagi
      FROM zko.rozkroje_formatki rf
      WHERE rf.rozkroj_id = $1
      ORDER BY rf.pozycja
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching formatki:', error);
    res.status(500).json({ error: 'Failed to fetch formatki' });
  }
});

export default router;