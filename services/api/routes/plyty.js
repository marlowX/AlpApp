// Endpoint dla płyt - routes/plyty.js
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Konfiguracja PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'alpsys_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'alpsys',
  password: process.env.DB_PASSWORD || 'your_password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// GET /api/plyty/active - Pobiera aktywne płyty
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
        cena_za_plyte
      FROM public.plyty 
      WHERE aktywna = true
    `;
    
    const params = [];
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
    
    // Sortowanie po popularności
    query += ` 
      ORDER BY 
        stan_magazynowy DESC, 
        struktura DESC NULLS LAST, 
        kolor_nazwa ASC
      LIMIT $${paramCount + 1}
    `;
    params.push(Number(limit));
    
    console.log('Executing plyty query:', query);
    console.log('With params:', params);
    
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

// GET /api/plyty - Fallback endpoint
router.get('/', async (req, res) => {
  try {
    // Przekieruj na /active
    req.url = '/active';
    return router.handle(req, res);
  } catch (error) {
    console.error('Error in plyty fallback:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd endpoint płyt'
    });
  }
});

module.exports = router;
