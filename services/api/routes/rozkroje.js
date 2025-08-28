// Endpoint dla rozkrojów - routes/rozkroje.js
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

// GET /api/rozkroje - Pobiera rozkroje
router.get('/', async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        id,
        kod_rozkroju,
        opis,
        rozmiar_plyty,
        typ_plyty,
        utworzony,
        aktywny
      FROM zko.rozkroje 
      WHERE aktywny = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Filtrowanie po wyszukiwanej frazie
    if (search && typeof search === 'string') {
      paramCount++;
      query += ` AND (
        kod_rozkroju ILIKE $${paramCount} 
        OR opis ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }
    
    query += ` 
      ORDER BY kod_rozkroju DESC
      LIMIT $${paramCount + 1}
    `;
    params.push(Number(limit));
    
    console.log('Executing rozkroje query:', query);
    console.log('With params:', params);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching rozkroje:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas pobierania rozkrojów',
      details: error.message
    });
  }
});

// GET /api/rozkroje/:id/formatki - Pobiera formatki dla rozkroju
router.get('/:id/formatki', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        nazwa_formatki,
        dlugosc,
        szerokosc,
        ilosc_sztuk,
        typ_plyty
      FROM zko.rozkroje_formatki 
      WHERE rozkroj_id = $1
      ORDER BY nazwa_formatki
    `;
    
    console.log('Fetching formatki for rozkroj:', id);
    
    const result = await pool.query(query, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      rozkroj_id: id
    });
    
  } catch (error) {
    console.error('Error fetching formatki:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas pobierania formatek',
      details: error.message
    });
  }
});

module.exports = router;
