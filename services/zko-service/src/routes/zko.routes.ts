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
    stan_magazynowy: z.number().optional(),
    grubosc: z.union([z.number(), z.string()]).optional(), // Akceptuj number lub string
  })),
  kolejnosc: z.number().optional().nullable(),
  uwagi: z.string().optional().nullable(),
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
    
    logger.info('Fetching ZKO list with params:', { status, kooperant, priorytet, page, limit });
    
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
    
    logger.debug('Executing query:', query);
    logger.debug('With params:', params);
    
    const result = await db.query(query, params);
    
    const total = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const data = result.rows.map(row => {
      const { total_count, ...rest } = row;
      return rest;
    });
    
    logger.info(`Found ${data.length} ZKO records, total: ${total}`);
    
    res.json({ data, total });
  } catch (error: any) {
    logger.error('Error fetching ZKO list:', error);
    logger.error('Error details:', { 
      message: error.message, 
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position
    });
    
    // Zwracamy bardziej szczegółowy błąd w trybie development
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ 
        error: 'Failed to fetch ZKO list',
        details: {
          message: error.message,
          code: error.code,
          detail: error.detail
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch ZKO list' });
    }
  }
});

// GET /api/zko/:id - Szczegóły ZKO
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`Fetching ZKO details for ID: ${id}`);
    
    // Pobierz ZKO
    const zkoResult = await db.query(
      'SELECT * FROM zko.zlecenia WHERE id = $1',
      [id]
    );
    
    if (zkoResult.rows.length === 0) {
      logger.warn(`ZKO not found with ID: ${id}`);
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
    
    logger.info(`Found ZKO with ${pozycjeResult.rows.length} positions and ${paletyResult.rows.length} pallets`);
    
    res.json({
      ...zko,
      pozycje: pozycjeResult.rows,
      palety: paletyResult.rows,
    });
  } catch (error: any) {
    logger.error('Error fetching ZKO details:', error);
    logger.error('Error details:', { 
      message: error.message, 
      code: error.code,
      detail: error.detail
    });
    
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ 
        error: 'Failed to fetch ZKO details',
        details: {
          message: error.message,
          code: error.code,
          detail: error.detail
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch ZKO details' });
    }
  }
});

// POST /api/zko/create - Tworzenie nowego ZKO
router.post('/create', async (req, res) => {
  try {
    const data = CreateZKOSchema.parse(req.body);
    
    logger.info('Creating new ZKO:', data);
    
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
      logger.info('ZKO created successfully:', response);
    }
    
    res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error creating ZKO:', error);
    
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ 
        error: 'Failed to create ZKO',
        details: {
          message: error.message,
          code: error.code,
          detail: error.detail
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to create ZKO' });
    }
  }
});

// POST /api/zko/pozycje/add - Dodawanie pozycji
router.post('/pozycje/add', async (req, res) => {
  try {
    logger.info('Received add pozycja request:', req.body);
    
    // Konwertuj grubosc na number jeśli przyszło jako string
    const requestData = {
      ...req.body,
      kolory_plyty: req.body.kolory_plyty.map((kp: any) => ({
        ...kp,
        grubosc: kp.grubosc ? parseFloat(kp.grubosc) : undefined
      }))
    };
    
    // Walidacja danych wejściowych
    const data = AddPozycjaSchema.parse(requestData);
    
    logger.info('Validated data:', data);
    
    // Opcja 1: Spróbuj użyć funkcji PostgreSQL jeśli istnieje
    try {
      // Przygotuj dane w formacie JSONB dla funkcji
      const koloryPlytyJson = JSON.stringify(data.kolory_plyty);
      
      logger.info('Calling PostgreSQL function zko.dodaj_pozycje_do_zko');
      
      const result = await db.query(`
        SELECT * FROM zko.dodaj_pozycje_do_zko($1, $2, $3::jsonb, $4, $5)
      `, [
        data.zko_id,
        data.rozkroj_id,
        koloryPlytyJson,
        data.kolejnosc || null,
        data.uwagi || null
      ]);
      
      logger.info('Function result:', result.rows[0]);
      
      const response = result.rows[0];
      
      res.json({
        sukces: true,
        pozycja_id: response.pozycja_id,
        formatki_dodane: response.formatki_dodane,
        komunikat: response.komunikat
      });
      
      // Emit WebSocket update
      emitZKOUpdate(data.zko_id, 'zko:pozycja:added', {
        zko_id: data.zko_id,
        pozycja_id: response.pozycja_id,
      });
      
    } catch (pgFunctionError: any) {
      // Jeśli funkcja nie istnieje, użyj alternatywnej metody
      logger.warn('PostgreSQL function not available, using fallback method:', pgFunctionError.message);
      
      // Opcja 2: Bezpośrednie wstawienie do tabel
      const client = await db.connect();
      
      try {
        await client.query('BEGIN');
        
        const pozycjeIds = [];
        let totalFormatki = 0;
        
        // Dla każdej płyty w pozycji, dodaj osobną pozycję
        for (const plyta of data.kolory_plyty) {
          // Wstaw pozycję
          const pozycjaResult = await client.query(`
            INSERT INTO zko.pozycje (
              zko_id, 
              rozkroj_id, 
              kolor_plyty, 
              nazwa_plyty, 
              ilosc_plyt,
              plyty_id,
              kolejnosc, 
              uwagi,
              status,
              created_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'oczekuje', NOW())
            RETURNING id
          `, [
            data.zko_id,
            data.rozkroj_id,
            plyta.kolor,
            plyta.nazwa,
            plyta.ilosc,
            plyta.plyta_id || null,
            data.kolejnosc || null,
            data.uwagi || null
          ]);
          
          const pozycjaId = pozycjaResult.rows[0].id;
          pozycjeIds.push(pozycjaId);
          
          // Pobierz formatki z rozkroju
          const formatkiResult = await client.query(`
            SELECT * FROM zko.rozkroje_formatki 
            WHERE rozkroj_id = $1
            ORDER BY pozycja
          `, [data.rozkroj_id]);
          
          // Dodaj formatki do pozycji
          for (const formatka of formatkiResult.rows) {
            await client.query(`
              INSERT INTO zko.pozycje_formatki (
                pozycja_id,
                rozkroj_formatka_id,
                nazwa_formatki,
                dlugosc,
                szerokosc,
                ilosc_planowana,
                ilosc_wyprodukowana,
                ilosc_uszkodzona,
                ilosc_na_magazyn,
                status
              )
              VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, 'oczekuje')
            `, [
              pozycjaId,
              formatka.id,
              `${formatka.nazwa_formatki || `${formatka.dlugosc}x${formatka.szerokosc}`} - ${plyta.kolor}`,
              formatka.dlugosc,
              formatka.szerokosc,
              formatka.ilosc_sztuk * plyta.ilosc
            ]);
            
            totalFormatki += formatka.ilosc_sztuk * plyta.ilosc;
          }
        }
        
        await client.query('COMMIT');
        
        logger.info('Successfully added pozycje:', { pozycjeIds, totalFormatki });
        
        // Zwróć informacje o dodanych pozycjach
        res.json({
          sukces: true,
          pozycje_ids: pozycjeIds,
          komunikat: `Dodano ${pozycjeIds.length} pozycji do ZKO`,
          formatki_dodane: totalFormatki
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
    }
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error:', error.errors);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    logger.error('Error adding pozycja:', {
      message: error.message,
      stack: error.stack,
      detail: error.detail
    });
    
    // Zwróć szczegółowy błąd
    res.status(500).json({ 
      error: 'Failed to add pozycja',
      message: error.message,
      detail: error.detail || 'Check server logs for more information'
    });
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error changing status:', error);
    
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ 
        error: 'Failed to change status',
        details: {
          message: error.message,
          code: error.code,
          detail: error.detail
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to change status' });
    }
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
  } catch (error: any) {
    logger.error('Error fetching next steps:', error);
    
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ 
        error: 'Failed to fetch next steps',
        details: {
          message: error.message,
          code: error.code,
          detail: error.detail
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch next steps' });
    }
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
  } catch (error: any) {
    logger.error('Error fetching ZKO status:', error);
    
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ 
        error: 'Failed to fetch ZKO status',
        details: {
          message: error.message,
          code: error.code,
          detail: error.detail
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch ZKO status' });
    }
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
  } catch (error: any) {
    logger.error('Error completing ZKO:', error);
    
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ 
        error: 'Failed to complete ZKO',
        details: {
          message: error.message,
          code: error.code,
          detail: error.detail
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to complete ZKO' });
    }
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
  } catch (error: any) {
    logger.error('Error deleting ZKO:', error);
    
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ 
        error: 'Failed to delete ZKO',
        details: {
          message: error.message,
          code: error.code,
          detail: error.detail
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to delete ZKO' });
    }
  }
});

export default router;