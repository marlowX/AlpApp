// Główny serwer API - server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:4173'
  ], 
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Konfiguracja PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'alpsys_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'alpsys',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test połączenia z bazą
pool.connect((err, client, done) => {
  if (err) {
    console.error('❌ Błąd połączenia z PostgreSQL:', err.message);
    console.log('⚠️  Serwer będzie działał z fallback danymi');
  } else {
    console.log('✅ Połączono z PostgreSQL');
    done();
  }
});

// Import routes
const plytyRoutes = require('./routes/plyty');
const rozkrojeRoutes = require('./routes/rozkroje');

// Routes
app.use('/api/plyty', plytyRoutes);
app.use('/api/rozkroje', rozkrojeRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'Disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'Connected';
  } catch (error) {
    dbStatus = `Error: ${error.message}`;
  }
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus,
    node_version: process.version,
    port: port
  });
});

// ZKO endpoints
app.get('/api/zko', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, numer_zko, kooperant, status, priorytet,
        data_utworzenia, data_planowana, utworzyl
      FROM zko.zlecenia 
      ORDER BY data_utworzenia DESC 
      LIMIT 50
    `;
    
    const result = await pool.query(query);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching ZKO:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas pobierania ZKO',
      details: error.message
    });
  }
});

app.get('/api/zko/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Pobierz ZKO
    const zkoQuery = `
      SELECT * FROM zko.zlecenia WHERE id = $1
    `;
    
    // Pobierz pozycje
    const pozycjeQuery = `
      SELECT 
        p.*,
        r.kod_rozkroju
      FROM zko.pozycje p
      LEFT JOIN zko.rozkroje r ON p.rozkroj_id = r.id
      WHERE p.zko_id = $1
      ORDER BY p.kolejnosc, p.id
    `;
    
    // Pobierz palety
    const paletyQuery = `
      SELECT * FROM zko.palety WHERE zko_id = $1
      ORDER BY data_utworzenia
    `;
    
    const [zkoResult, pozycjeResult, paletyResult] = await Promise.all([
      pool.query(zkoQuery, [id]),
      pool.query(pozycjeQuery, [id]),
      pool.query(paletyQuery, [id])
    ]);
    
    if (zkoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ZKO nie znalezione'
      });
    }
    
    const zko = {
      ...zkoResult.rows[0],
      pozycje: pozycjeResult.rows,
      palety: paletyResult.rows
    };
    
    res.json(zko);
    
  } catch (error) {
    console.error('Error fetching ZKO details:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas pobierania szczegółów ZKO',
      details: error.message
    });
  }
});

// Endpoint do dodawania pozycji
app.post('/api/zko/pozycje/add', async (req, res) => {
  try {
    const { zko_id, rozkroj_id, kolory_plyty, kolejnosc, uwagi } = req.body;
    
    console.log('Dodawanie pozycji:', { zko_id, rozkroj_id, kolory_plyty });
    
    // Wywołaj funkcję PostgreSQL
    const query = `
      SELECT * FROM zko.dodaj_pozycje_do_zko(
        $1::integer, 
        $2::integer, 
        $3::jsonb, 
        $4::integer, 
        $5::text
      )
    `;
    
    const result = await pool.query(query, [
      zko_id,
      rozkroj_id, 
      JSON.stringify(kolory_plyty),
      kolejnosc,
      uwagi
    ]);
    
    if (result.rows.length > 0) {
      const response = result.rows[0];
      res.json({
        sukces: true,
        pozycja_id: response.pozycja_id,
        formatki_dodane: response.formatki_dodane,
        komunikat: response.komunikat
      });
    } else {
      throw new Error('Brak odpowiedzi z funkcji bazy danych');
    }
    
  } catch (error) {
    console.error('Error adding pozycja:', error);
    res.status(500).json({
      sukces: false,
      error: 'Błąd podczas dodawania pozycji',
      details: error.message,
      komunikat: 'Sprawdź połączenie z bazą danych i funkcję dodaj_pozycje_do_zko()'
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Wewnętrzny błąd serwera',
    details: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint nie znaleziony',
    path: req.originalUrl,
    available_endpoints: [
      'GET /api/health',
      'GET /api/plyty/active',
      'GET /api/rozkroje',
      'GET /api/zko',
      'POST /api/zko/pozycje/add'
    ]
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Zamykanie serwera...');
  pool.end(() => {
    console.log('✅ Połączenia z bazą zamknięte');
    process.exit(0);
  });
});

app.listen(port, () => {
  console.log(`🚀 API Server running on port ${port}`);
  console.log(`📡 Health check: http://localhost:${port}/api/health`);
  console.log(`🔗 Frontend CORS: http://localhost:3000, http://localhost:5173`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'alpsys'}@${process.env.DB_HOST || 'localhost'}`);
});

module.exports = app;
