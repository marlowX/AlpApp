// API endpoint dla płyt - /api/plyty/active
import express from 'express';
import { Pool } from 'pg';

const router = express.Router();

// Konfiguracja PostgreSQL (można przenieść do zmiennych środowiskowych)
const pool = new Pool({
  user: process.env.DB_USER || 'alpsys_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'alpsys',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

/**
 * GET /api/plyty/active - Pobiera aktywne płyty sortowane po popularności
 * Query params:
 * - search: string - wyszukiwanie w opisie
 * - limit: number - limit wyników (default: 100)
 * - grubosc: number - filtrowanie po grubości
 */
router.get('/active', async (req, res) => {
  try {
    const { search, limit = 100, grubosc } = req.query;
    
    let query = `
      SELECT 
        id, 
        nazwa, 
        opis, 
        kolor_nazwa, 
        grubosc, 
        stan_magazynowy, 
        aktywna, 
        struktura, 
        cena_za_plyte,
        powierzchnia_m2,
        created_at,
        updated_at
      FROM public.plyty 
      WHERE aktywna = true
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    // Filtrowanie po wyszukiwanej frazie
    if (search && typeof search === 'string') {
      paramCount++;
      query += ` AND (
        opis ILIKE $${paramCount} 
        OR kolor_nazwa ILIKE $${paramCount} 
        OR nazwa ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }
    
    // Filtrowanie po grubości
    if (grubosc && !isNaN(Number(grubosc))) {
      paramCount++;
      query += ` AND grubosc = $${paramCount}`;
      params.push(Number(grubosc));
    }
    
    // Sortowanie: stan magazynowy DESC (popularność), struktura, nazwa
    query += ` 
      ORDER BY 
        stan_magazynowy DESC, 
        struktura DESC NULLS LAST, 
        nazwa ASC
      LIMIT $${paramCount + 1}
    `;
    params.push(Number(limit));
    
    console.log('Executing plyty query:', query, 'with params:', params);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      query_info: {
        search,
        grubosc,
        limit: Number(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching plyty:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas pobierania płyt',
      details: error.message
    });
  }
});

/**
 * GET /api/plyty/kolory - Lista unikalnych kolorów z statystykami
 */
router.get('/kolory', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT 
        kolor_nazwa,
        COUNT(*) as ilosc_wariantow,
        SUM(stan_magazynowy) as total_sztuk,
        AVG(cena_za_plyte) as avg_cena,
        MAX(stan_magazynowy) as max_stan,
        MIN(stan_magazynowy) as min_stan
      FROM public.plyty 
      WHERE aktywna = true AND kolor_nazwa IS NOT NULL
      GROUP BY kolor_nazwa
      ORDER BY total_sztuk DESC, kolor_nazwa
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      kolory: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching kolory:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas pobierania kolorów'
    });
  }
});

export { router as plytyRouter };
