import { Router } from 'express';
import { z } from 'zod';
import { db, emitZKOUpdate } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();

// Validation schemas
const CreateZKOSchema = z.object({
  kooperant: z.string().min(1),
  priorytet: z.number().min(1).max(10).default(5),
  komentarz: z.string().optional(),
});

const AddPozycjaSchema = z.object({
  zko_id: z.number(),
  rozkroj_id: z.number(),
  kolory_plyty: z.array(z.object({
    plyta_id: z.number().optional(),
    kolor: z.string(),
    nazwa: z.string(),
    ilosc: z.number().positive(),
  })),
  kolejnosc: z.number().optional(),
  uwagi: z.string().optional(),
});

const ChangeStatusSchema = z.object({
  zko_id: z.number(),
  nowy_etap_kod: z.string(),
  komentarz: z.string().optional(),
  operator: z.string().optional(),
  lokalizacja: z.string().optional(),
});

// GET /api/zko - Lista ZKO
router.get('/', async (req, res) => {
  try {
    const { status, kooperant, priorytet, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = `
      SELECT z.*, COUNT(*) OVER() as total_count
      FROM zko.zlecenia z
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND z.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (kooperant) {
      query += ` AND z.kooperant ILIKE $${paramCount}`;
      params.push(`%${kooperant}%`);
      paramCount++;
    }
    
    if (priorytet) {
      query += ` AND z.priorytet = $${paramCount}`;
      params.push(Number(priorytet));
      paramCount++;
    }
    
    query += ` ORDER BY z.id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);
    
    const result = await db.query(query, params);
    
    const total = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const data = result.rows.map(row => {
      const { total_count, ...rest } = row;
      return rest;
    });
    
    res.json({ data, total });
  } catch (error) {
    logger.error('Error fetching ZKO list:', error);
    res.status(500).json({ error: 'Failed to fetch ZKO list' });
  }
});

// GET /api/zko/:id - Szczegóły ZKO
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Pobierz ZKO
    const zkoResult = await db.query(
      'SELECT * FROM zko.zlecenia WHERE id = $1',
      [id]
    );
    
    if (zkoResult.rows.length === 0) {
      return res.status(404).json({ error: 'ZKO not found' });
    }
    
    const zko = zkoResult.rows[0];
    
    // Pobierz pozycje z dodatkowymi informacjami o rozkroju
    const pozycjeResult = await db.query(`
      SELECT 
        p.*,
        r.kod_rozkroju,
        r.opis as rozkroj_opis
      FROM zko.pozycje p
      LEFT JOIN zko.rozkroje r ON p.rozkroj_id = r.id
      WHERE p.zko_id = $1 
      ORDER BY p.kolejnosc
    `, [id]);
    
    // Pobierz palety
    const paletyResult = await db.query(
      'SELECT * FROM zko.palety WHERE zko_id = $1 ORDER BY id',
      [id]
    );
    
    res.json({
      ...zko,
      pozycje: pozycjeResult.rows,
      palety: paletyResult.rows,
    });
  } catch (error) {
    logger.error('Error fetching ZKO details:', error);
    res.status(500).json({ error: 'Failed to fetch ZKO details' });
  }
});

// POST /api/zko/create - Tworzenie nowego ZKO
router.post('/create', async (req, res) => {
  try {
    const data = CreateZKOSchema.parse(req.body);
    
    const result = await db.query(
      `SELECT * FROM zko.utworz_puste_zko($1, $2, $3, $4)`,
      [data.kooperant, data.priorytet, 'system', data.komentarz]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      emitZKOUpdate(response.zko_id, 'zko:created', {
        zko_id: response.zko_id,
        numer_zko: response.numer_zko,
      });
    }
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error creating ZKO:', error);
    res.status(500).json({ error: 'Failed to create ZKO' });
  }
});

// POST /api/zko/pozycje/add - Dodawanie pozycji (ulepszona wersja)
router.post('/pozycje/add', async (req, res) => {
  try {
    const data = AddPozycjaSchema.parse(req.body);
    
    // Rozpocznij transakcję
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Dla każdej płyty w pozycji, dodaj osobną pozycję
      const pozycjeIds = [];
      
      for (const plyta of data.kolory_plyty) {
        const result = await client.query(`
          INSERT INTO zko.pozycje (
            zko_id, 
            rozkroj_id, 
            kolor_plyty, 
            nazwa_plyty, 
            ilosc_plyt, 
            kolejnosc, 
            uwagi,
            created_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING id
        `, [
          data.zko_id,
          data.rozkroj_id,
          plyta.kolor,
          plyta.nazwa,
          plyta.ilosc,
          data.kolejnosc || null,
          data.uwagi || null
        ]);
        
        const pozycjaId = result.rows[0].id;
        pozycjeIds.push(pozycjaId);
        
        // Skopiuj formatki z rozkroju do pozycji
        await client.query(`
          INSERT INTO zko.pozycje_formatki (
            pozycja_id,
            nazwa_formatki,
            dlugosc,
            szerokosc,
            ilosc_planowana,
            ilosc_wyprodukowana,
            ilosc_uszkodzona,
            ilosc_na_magazyn
          )
          SELECT 
            $1,
            rf.nazwa_formatki,
            rf.dlugosc,
            rf.szerokosc,
            rf.ilosc_sztuk * $2, -- ilość formatek * ilość płyt
            0,
            0,
            0
          FROM zko.rozkroje_formatki rf
          WHERE rf.rozkroj_id = $3
        `, [pozycjaId, plyta.ilosc, data.rozkroj_id]);
      }
      
      await client.query('COMMIT');
      
      // Zwróć informacje o dodanych pozycjach
      res.json({
        sukces: true,
        pozycje_ids: pozycjeIds,
        komunikat: `Dodano ${pozycjeIds.length} pozycji do ZKO`,
        formatki_dodane: pozycjeIds.length * data.kolory_plyty.reduce((sum, p) => sum + p.ilosc, 0)
      });
      
      // Emit WebSocket update
      emitZKOUpdate(data.zko_id, 'zko:pozycja:added', {
        zko_id: data.zko_id,
        pozycje_ids: pozycjeIds,
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error adding pozycja:', error);
    res.status(500).json({ error: 'Failed to add pozycja' });
  }
});

// POST /api/zko/status/change - Zmiana statusu
router.post('/status/change', async (req, res) => {
  try {
    const data = ChangeStatusSchema.parse(req.body);
    
    const result = await db.query(
      `SELECT * FROM zko.zmien_status_v3($1, $2, $3, $4, $5, $6)`,
      [
        data.zko_id,
        data.nowy_etap_kod,
        'system',
        data.komentarz || null,
        data.operator || null,
        data.lokalizacja || null
      ]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      emitZKOUpdate(data.zko_id, 'zko:status:changed', {
        zko_id: data.zko_id,
        stary_status: response.stary_status,
        nowy_status: response.nowy_status,
      });
    }
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error changing status:', error);
    res.status(500).json({ error: 'Failed to change status' });
  }
});

// GET /api/zko/:id/next-steps - Następne kroki workflow
router.get('/:id/next-steps', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT * FROM zko.pobierz_nastepne_etapy($1)`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching next steps:', error);
    res.status(500).json({ error: 'Failed to fetch next steps' });
  }
});

// GET /api/zko/:id/status - Status zlecenia
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT * FROM zko.pokaz_status_zko($1)`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ZKO not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching ZKO status:', error);
    res.status(500).json({ error: 'Failed to fetch ZKO status' });
  }
});

// POST /api/zko/:id/complete - Zakończenie zlecenia
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { operator, komentarz } = req.body;
    
    const result = await db.query(
      `SELECT * FROM zko.zakoncz_zlecenie($1, $2, $3)`,
      [id, operator || null, komentarz || null]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      emitZKOUpdate(Number(id), 'zko:completed', {
        zko_id: Number(id),
        podsumowanie: response.podsumowanie,
      });
    }
    
    res.json(response);
  } catch (error) {
    logger.error('Error completing ZKO:', error);
    res.status(500).json({ error: 'Failed to complete ZKO' });
  }
});

// DELETE /api/zko/:id - Usunięcie ZKO
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT * FROM zko.usun_zko($1)`,
      [id]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      emitZKOUpdate(Number(id), 'zko:deleted', {
        zko_id: Number(id),
      });
    }
    
    res.json(response);
  } catch (error) {
    logger.error('Error deleting ZKO:', error);
    res.status(500).json({ error: 'Failed to delete ZKO' });
  }
});

export default router;