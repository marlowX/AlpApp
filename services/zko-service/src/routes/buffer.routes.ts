import { Router } from 'express';
import { z } from 'zod';
import { db, emitZKOUpdate } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();

// Validation schema
const AcceptToBufferSchema = z.object({
  paleta_id: z.number(),
  miejsce_numer: z.string().optional(),
  operator: z.string().optional(),
  priorytet: z.number().min(1).max(10).default(5),
  planowana_data_oklejania: z.string().optional(),
  uwagi: z.string().optional(),
});

// POST /api/buffer/okleiniarka/accept - Przyjęcie na bufor okleiniarki
router.post('/okleiniarka/accept', async (req, res) => {
  try {
    const data = AcceptToBufferSchema.parse(req.body);
    
    const result = await db.query(
      `SELECT * FROM zko.przyjmij_na_bufor_okleiniarka($1, $2, $3, $4, $5, $6)`,
      [
        data.paleta_id,
        data.miejsce_numer || null,
        data.operator || null,
        data.priorytet,
        data.planowana_data_oklejania || null,
        data.uwagi || null
      ]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      // Get ZKO ID for WebSocket
      const paletaResult = await db.query(
        'SELECT zko_id FROM zko.palety WHERE id = $1',
        [data.paleta_id]
      );
      
      if (paletaResult.rows.length > 0) {
        emitZKOUpdate(paletaResult.rows[0].zko_id, 'buffer:accepted', {
          paleta_id: data.paleta_id,
          buffer: 'okleiniarka',
          miejsce: response.miejsce_numer,
        });
      }
    }
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error accepting to buffer:', error);
    res.status(500).json({ error: 'Failed to accept to buffer' });
  }
});

// GET /api/buffer/okleiniarka/status - Stan bufora okleiniarki
router.get('/okleiniarka/status', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM zko.stan_bufora_okleiniarka()`
    );
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching buffer status:', error);
    res.status(500).json({ error: 'Failed to fetch buffer status' });
  }
});

// GET /api/buffer/overview - Przegląd wszystkich buforów
router.get('/overview', async (req, res) => {
  try {
    const buffers = [
      'BUFOR_PILA',
      'BUFOR_OKLEINIARKA',
      'BUFOR_WIERTARKA',
      'BUFOR_KOMPLETOWANIE',
      'BUFOR_PAKOWANIE',
      'BUFOR_WYSYLKA'
    ];
    
    const result = await db.query(
      `SELECT 
        sp.kod_statusu as buffer,
        sp.nazwa as buffer_nazwa,
        COUNT(p.id) as liczba_palet,
        SUM(p.waga_kg) as total_waga,
        MAX(p.wysokosc_cm) as max_wysokosc,
        STRING_AGG(DISTINCT z.numer_zko, ', ') as zlecenia
      FROM zko.statusy_palet sp
      LEFT JOIN zko.palety p ON p.status = sp.kod_statusu
      LEFT JOIN zko.zlecenia z ON z.id = p.zko_id
      WHERE sp.kod_statusu = ANY($1::text[])
      GROUP BY sp.kod_statusu, sp.nazwa
      ORDER BY sp.kolejnosc`,
      [buffers]
    );
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching buffer overview:', error);
    res.status(500).json({ error: 'Failed to fetch buffer overview' });
  }
});

// GET /api/buffer/:type/pallets - Lista palet w buforze
router.get('/:type/pallets', async (req, res) => {
  try {
    const { type } = req.params;
    const bufferType = `BUFOR_${type.toUpperCase()}`;
    
    const result = await db.query(
      `SELECT 
        p.*,
        z.numer_zko,
        z.kooperant,
        z.priorytet as zko_priorytet,
        poz.kolor_plyty,
        poz.nazwa_plyty,
        COUNT(pf.id) as liczba_formatek
      FROM zko.palety p
      JOIN zko.zlecenia z ON z.id = p.zko_id
      LEFT JOIN zko.pozycje poz ON poz.id = p.pozycja_id
      LEFT JOIN zko.pozycje_formatki pf ON pf.pozycja_id = poz.id
      WHERE p.status = $1
      GROUP BY p.id, z.id, poz.id
      ORDER BY z.priorytet DESC, p.id`,
      [bufferType]
    );
    
    res.json(result.rows);
  } catch (error) {
    logger.error(`Error fetching pallets for buffer ${req.params.type}:`, error);
    res.status(500).json({ error: 'Failed to fetch buffer pallets' });
  }
});

// PUT /api/buffer/release/:paletaId - Zwolnienie z bufora
router.put('/release/:paletaId', async (req, res) => {
  try {
    const { paletaId } = req.params;
    const { next_status, operator } = req.body;
    
    // Update pallet status
    const result = await db.query(
      `UPDATE zko.palety 
       SET status = $1, 
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [next_status, paletaId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pallet not found' });
    }
    
    const pallet = result.rows[0];
    
    // Log the change
    await db.query(
      `INSERT INTO zko.historia_statusow (zko_id, status_poprzedni, status_nowy, uzytkownik, operator)
       VALUES ($1, $2, $3, $4, $5)`,
      [pallet.zko_id, pallet.status, next_status, 'system', operator || null]
    );
    
    emitZKOUpdate(pallet.zko_id, 'buffer:released', {
      paleta_id: Number(paletaId),
      from_status: pallet.status,
      to_status: next_status,
    });
    
    res.json({
      sukces: true,
      komunikat: `Paleta ${pallet.numer_palety} zwolniona z bufora`,
      paleta: pallet,
    });
  } catch (error) {
    logger.error('Error releasing from buffer:', error);
    res.status(500).json({ error: 'Failed to release from buffer' });
  }
});

export default router;
