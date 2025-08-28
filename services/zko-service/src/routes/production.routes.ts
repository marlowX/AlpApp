import { Router } from 'express';
import { z } from 'zod';
import { db, emitZKOUpdate } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();

// Validation schemas
const StartProductionSchema = z.object({
  pozycja_id: z.number(),
  operator: z.string().optional(),
  stanowisko: z.string().default('ciecie'),
  komentarz: z.string().optional(),
});

const ReportProductionSchema = z.object({
  pozycja_id: z.number(),
  formatka_id: z.number(),
  ilosc_ok: z.number().nonnegative(),
  ilosc_uszkodzona: z.number().nonnegative().default(0),
  operator: z.string().optional(),
  uwagi: z.string().optional(),
});

const ReportDamageSchema = z.object({
  zko_id: z.number(),
  formatka_id: z.number().optional(),
  formatka_typ: z.string().optional(),
  ilosc: z.number().positive(),
  etap: z.string(),
  typ_uszkodzenia: z.string(),
  opis: z.string().optional(),
  operator: z.string().default('operator'),
  mozna_naprawic: z.boolean().default(false),
});

// POST /api/production/start - Rozpoczęcie produkcji
router.post('/start', async (req, res) => {
  try {
    const data = StartProductionSchema.parse(req.body);
    
    const result = await db.query(
      `SELECT * FROM zko.rozpocznij_produkcje_pozycji($1, $2, $3, $4)`,
      [
        data.pozycja_id,
        data.operator || null,
        data.stanowisko,
        data.komentarz || null
      ]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      emitZKOUpdate(response.zko_id, 'production:started', {
        zko_id: response.zko_id,
        pozycja_id: data.pozycja_id,
        stanowisko: data.stanowisko,
      });
    }
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error starting production:', error);
    res.status(500).json({ error: 'Failed to start production' });
  }
});

// POST /api/production/report - Raportowanie produkcji
router.post('/report', async (req, res) => {
  try {
    const data = ReportProductionSchema.parse(req.body);
    
    const result = await db.query(
      `SELECT * FROM zko.raportuj_produkcje_formatek($1, $2, $3, $4, $5, $6)`,
      [
        data.pozycja_id,
        data.formatka_id,
        data.ilosc_ok,
        data.ilosc_uszkodzona,
        data.operator || null,
        data.uwagi || null
      ]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      // Get ZKO ID
      const pozycjaResult = await db.query(
        'SELECT zko_id FROM zko.pozycje WHERE id = $1',
        [data.pozycja_id]
      );
      
      if (pozycjaResult.rows.length > 0) {
        emitZKOUpdate(pozycjaResult.rows[0].zko_id, 'production:reported', {
          pozycja_id: data.pozycja_id,
          formatka_id: data.formatka_id,
          procent_wykonania: response.procent_wykonania,
        });
      }
    }
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error reporting production:', error);
    res.status(500).json({ error: 'Failed to report production' });
  }
});

// POST /api/production/damage - Zgłoszenie uszkodzenia
router.post('/damage', async (req, res) => {
  try {
    const data = ReportDamageSchema.parse(req.body);
    
    const result = await db.query(
      `SELECT * FROM zko.zglos_uszkodzenie_formatki($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        data.zko_id,
        data.formatka_id || null,
        data.formatka_typ || null,
        data.ilosc,
        data.etap,
        data.typ_uszkodzenia,
        data.opis || null,
        data.operator,
        data.mozna_naprawic
      ]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      emitZKOUpdate(data.zko_id, 'damage:reported', {
        zko_id: data.zko_id,
        uszkodzenie_id: response.uszkodzenie_id,
        typ: data.typ_uszkodzenia,
        ilosc: data.ilosc,
      });
    }
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error reporting damage:', error);
    res.status(500).json({ error: 'Failed to report damage' });
  }
});

// GET /api/production/queue - Kolejka zadań
router.get('/queue', async (req, res) => {
  try {
    const { stanowisko } = req.query;
    
    let query = `
      SELECT 
        z.id as zko_id,
        z.numer_zko,
        z.priorytet,
        p.id as pozycja_id,
        p.kolejnosc,
        p.kolor_plyty,
        p.nazwa_plyty,
        p.ilosc_plyt,
        es.kod_etapu as status,
        es.nazwa as status_nazwa
      FROM zko.zlecenia z
      JOIN zko.pozycje p ON p.zko_id = z.id
      LEFT JOIN tracking.etapy_slownik es ON z.etap_id = es.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    if (stanowisko === 'ciecie') {
      query += ` AND z.status IN ('nowe', 'CIECIE_START')`;
    } else if (stanowisko === 'oklejanie') {
      query += ` AND z.status IN ('BUFOR_OKLEINIARKA', 'OKLEJANIE_START')`;
    } else if (stanowisko === 'wiercenie') {
      query += ` AND z.status IN ('BUFOR_WIERTARKA', 'WIERCENIE_START')`;
    }
    
    query += ` ORDER BY z.priorytet DESC, z.id ASC`;
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching production queue:', error);
    res.status(500).json({ error: 'Failed to fetch production queue' });
  }
});

// GET /api/production/stats - Statystyki produkcji
router.get('/stats', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    const stats = await db.query(
      `SELECT 
        COUNT(DISTINCT z.id) as total_zko,
        COUNT(DISTINCT CASE WHEN z.status = 'ZAKONCZONE' THEN z.id END) as completed_zko,
        COUNT(DISTINCT p.id) as total_positions,
        SUM(pf.ilosc_planowana) as total_planned,
        SUM(pf.ilosc_wyprodukowana) as total_produced,
        SUM(pf.ilosc_uszkodzona) as total_damaged,
        CASE 
          WHEN SUM(pf.ilosc_planowana) > 0 
          THEN ROUND((SUM(pf.ilosc_wyprodukowana)::numeric / SUM(pf.ilosc_planowana)::numeric) * 100, 2)
          ELSE 0
        END as completion_percentage
      FROM zko.zlecenia z
      LEFT JOIN zko.pozycje p ON p.zko_id = z.id
      LEFT JOIN zko.pozycje_formatki pf ON pf.pozycja_id = p.id
      WHERE ($1::date IS NULL OR z.data_utworzenia >= $1)
        AND ($2::date IS NULL OR z.data_utworzenia <= $2)`,
      [date_from || null, date_to || null]
    );
    
    res.json(stats.rows[0]);
  } catch (error) {
    logger.error('Error fetching production stats:', error);
    res.status(500).json({ error: 'Failed to fetch production stats' });
  }
});

export default router;
