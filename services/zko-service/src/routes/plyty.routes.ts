import { Router } from 'express';
import { db } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();

// GET /api/plyty - Lista płyt z public schema
router.get('/', async (req, res) => {
  try {
    const { search, grubosc, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        id,
        nazwa,
        opis,
        kolor_nazwa,
        CAST(grubosc AS FLOAT) as grubosc,
        CAST(dlugosc AS FLOAT) as dlugosc,
        CAST(szerokosc AS FLOAT) as szerokosc,
        stan_magazynowy,
        CAST(cena_za_plyte AS FLOAT) as cena_za_plyte,
        CAST(cena_za_m2 AS FLOAT) as cena_za_m2,
        struktura,
        aktywna,
        powierzchnia_m2
      FROM public.plyty 
      WHERE aktywna = true
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    // Dodaj filtry jeśli są
    if (search) {
      query += ` AND (
        LOWER(nazwa) LIKE LOWER($${paramCount}) OR 
        LOWER(opis) LIKE LOWER($${paramCount}) OR 
        LOWER(kolor_nazwa) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (grubosc) {
      query += ` AND grubosc = $${paramCount}`;
      params.push(parseFloat(grubosc as string));
      paramCount++;
    }
    
    query += ` ORDER BY stan_magazynowy DESC, grubosc DESC, nazwa`;
    
    if (limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit as string));
    }
    
    logger.info('Wykonywanie zapytania płyt:', { query, params });
    
    const result = await db.query(query, params);
    
    // Upewnij się, że zwracamy liczby a nie stringi
    const processedRows = result.rows.map(row => ({
      ...row,
      grubosc: parseFloat(row.grubosc) || 0,
      dlugosc: row.dlugosc ? parseFloat(row.dlugosc) : null,
      szerokosc: row.szerokosc ? parseFloat(row.szerokosc) : null,
      cena_za_plyte: row.cena_za_plyte ? parseFloat(row.cena_za_plyte) : null,
      cena_za_m2: row.cena_za_m2 ? parseFloat(row.cena_za_m2) : null,
      stan_magazynowy: parseInt(row.stan_magazynowy) || 0,
      struktura: parseInt(row.struktura) || 0,
    }));
    
    logger.info(`Zwracam ${processedRows.length} płyt`);
    res.json(processedRows);
  } catch (error) {
    logger.error('Error fetching plyty:', error);
    res.status(500).json({ error: 'Failed to fetch plyty' });
  }
});

// GET /api/plyty/kolory - Lista unikalnych kolorów
router.get('/kolory', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT 
        kolor_nazwa,
        COUNT(*) as liczba_plyt
      FROM public.plyty 
      WHERE aktywna = true AND stan_magazynowy > 0
      GROUP BY kolor_nazwa
      ORDER BY kolor_nazwa
    `);
    
    res.json({ kolory: result.rows });
  } catch (error) {
    logger.error('Error fetching kolory:', error);
    res.status(500).json({ error: 'Failed to fetch kolory' });
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
        opis,
        kolor_nazwa,
        CAST(grubosc AS FLOAT) as grubosc,
        CAST(dlugosc AS FLOAT) as dlugosc,
        CAST(szerokosc AS FLOAT) as szerokosc,
        stan_magazynowy,
        CAST(cena_za_plyte AS FLOAT) as cena_za_plyte,
        CAST(cena_za_m2 AS FLOAT) as cena_za_m2,
        struktura,
        aktywna,
        powierzchnia_m2
      FROM public.plyty 
      WHERE id = $1 AND aktywna = true
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Płyta not found' });
    }
    
    // Upewnij się, że zwracamy liczby
    const plyta = result.rows[0];
    const processedPlyta = {
      ...plyta,
      grubosc: parseFloat(plyta.grubosc) || 0,
      dlugosc: plyta.dlugosc ? parseFloat(plyta.dlugosc) : null,
      szerokosc: plyta.szerokosc ? parseFloat(plyta.szerokosc) : null,
      cena_za_plyte: plyta.cena_za_plyte ? parseFloat(plyta.cena_za_plyte) : null,
      cena_za_m2: plyta.cena_za_m2 ? parseFloat(plyta.cena_za_m2) : null,
      stan_magazynowy: parseInt(plyta.stan_magazynowy) || 0,
      struktura: parseInt(plyta.struktura) || 0,
    };
    
    res.json(processedPlyta);
  } catch (error) {
    logger.error('Error fetching płyta:', error);
    res.status(500).json({ error: 'Failed to fetch płyta' });
  }
});

export default router;
