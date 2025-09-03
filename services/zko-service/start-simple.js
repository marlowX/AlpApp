// Prosty start bez TypeScript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5001;

// Database
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'alpsys',
  user: process.env.DB_USER || 'alpsys_user',
  password: process.env.DB_PASSWORD,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Basic ZKO endpoint
app.get('/api/zko', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM zko.zlecenia LIMIT 10');
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
