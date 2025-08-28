import { Router } from 'express';
import { z } from 'zod';
import { db } from '../index';
import pino from 'pino';

const router = Router();
const logger = pino();

// Schemat walidacji dla reguły
const RegulaSchema = z.object({
  nazwa_reguly: z.string(),
  priorytet: z.number().min(1).max(1000),
  warunek_liczba_kolorow: z.number().optional().nullable(),
  warunek_kierunek: z.enum(['oklejanie', 'wiercenie', 'mieszane']).optional().nullable(),
  warunek_typ_formatek: z.enum(['jednolite', 'rozne']).optional().nullable(),
  warunek_dodatkowy: z.record(z.any()).optional(),
  strategia_grupowania: z.string(),
  liczba_palet_formula: z.string(),
  max_formatek_na_palete: z.number().default(200),
  max_wysokosc_mm: z.number().default(1440),
  opis_reguly: z.string(),
  przyklad: z.string().optional(),
  aktywna: z.boolean().default(true)
});

// GET /api/pallets/rules - Lista reguł planowania
router.get('/rules', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM zko_config.v_reguly_planowania
      ORDER BY priorytet
    `);
    
    res.json({
      reguly: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching pallet rules:', error);
    res.status(500).json({ error: 'Failed to fetch pallet rules' });
  }
});

// GET /api/pallets/rules/:id - Szczegóły reguły
router.get('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const ruleResult = await db.query(
      'SELECT * FROM zko_config.reguly_planowania_palet WHERE id = $1',
      [id]
    );
    
    if (ruleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    const examplesResult = await db.query(
      'SELECT * FROM zko_config.reguly_przykladowe_przypadki WHERE regula_id = $1',
      [id]
    );
    
    res.json({
      regula: ruleResult.rows[0],
      przyklady: examplesResult.rows
    });
  } catch (error) {
    logger.error('Error fetching rule details:', error);
    res.status(500).json({ error: 'Failed to fetch rule details' });
  }
});

// POST /api/pallets/rules - Dodaj nową regułę
router.post('/rules', async (req, res) => {
  try {
    const data = RegulaSchema.parse(req.body);
    
    const result = await db.query(`
      INSERT INTO zko_config.reguly_planowania_palet (
        nazwa_reguly, priorytet, warunek_liczba_kolorow, warunek_kierunek,
        warunek_typ_formatek, warunek_dodatkowy, strategia_grupowania,
        liczba_palet_formula, max_formatek_na_palete, max_wysokosc_mm,
        opis_reguly, przyklad, aktywna, utworzyl
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      data.nazwa_reguly,
      data.priorytet,
      data.warunek_liczba_kolorow,
      data.warunek_kierunek,
      data.warunek_typ_formatek,
      data.warunek_dodatkowy ? JSON.stringify(data.warunek_dodatkowy) : null,
      data.strategia_grupowania,
      data.liczba_palet_formula,
      data.max_formatek_na_palete,
      data.max_wysokosc_mm,
      data.opis_reguly,
      data.przyklad,
      data.aktywna,
      'system'
    ]);
    
    logger.info('Created new pallet rule:', result.rows[0]);
    
    res.json({
      sukces: true,
      regula: result.rows[0],
      komunikat: 'Reguła została dodana'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// PUT /api/pallets/rules/:id - Aktualizuj regułę
router.put('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = RegulaSchema.partial().parse(req.body);
    
    // Buduj dynamiczne zapytanie UPDATE
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(key === 'warunek_dodatkowy' && value ? JSON.stringify(value) : value);
        paramCount++;
      }
    });
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `
      UPDATE zko_config.reguly_planowania_palet 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json({
      sukces: true,
      regula: result.rows[0],
      komunikat: 'Reguła została zaktualizowana'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// DELETE /api/pallets/rules/:id - Usuń regułę (dezaktywuj)
router.delete('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE zko_config.reguly_planowania_palet SET aktywna = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json({
      sukces: true,
      komunikat: 'Reguła została dezaktywowana'
    });
  } catch (error) {
    logger.error('Error deactivating rule:', error);
    res.status(500).json({ error: 'Failed to deactivate rule' });
  }
});

// POST /api/pallets/rules/test - Testuj regułę dla pozycji
router.post('/rules/test', async (req, res) => {
  try {
    const { pozycja_id } = req.body;
    
    if (!pozycja_id) {
      return res.status(400).json({ error: 'pozycja_id is required' });
    }
    
    // Analizuj pozycję
    const analizaResult = await db.query(
      'SELECT * FROM zko_config.analizuj_pozycje_dla_palet($1)',
      [pozycja_id]
    );
    
    if (analizaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    const analiza = analizaResult.rows[0];
    
    // Wybierz odpowiednią regułę
    const regulaResult = await db.query(
      `SELECT * FROM zko_config.wybierz_regule_planowania($1, $2, $3, $4)`,
      [
        analiza.liczba_kolorow,
        analiza.kierunki,
        analiza.typy_formatek,
        analiza.ilosc_formatek
      ]
    );
    
    res.json({
      analiza_pozycji: analiza,
      wybrana_regula: regulaResult.rows[0],
      rekomendacja: {
        liczba_palet: regulaResult.rows[0]?.liczba_palet || 1,
        strategia: regulaResult.rows[0]?.strategia_grupowania || 'po_kolorze',
        opis: regulaResult.rows[0]?.opis_reguly || 'Brak dopasowanej reguły'
      }
    });
  } catch (error) {
    logger.error('Error testing rules:', error);
    res.status(500).json({ error: 'Failed to test rules' });
  }
});

// GET /api/pallets/rules/history/:zkoId - Historia decyzji planowania
router.get('/rules/history/:zkoId', async (req, res) => {
  try {
    const { zkoId } = req.params;
    
    const result = await db.query(`
      SELECT 
        h.*,
        r.nazwa_reguly,
        r.opis_reguly
      FROM zko_config.historia_planowania_palet h
      LEFT JOIN zko_config.reguly_planowania_palet r ON h.zastosowana_regula_id = r.id
      WHERE h.zko_id = $1
      ORDER BY h.created_at DESC
    `, [zkoId]);
    
    res.json({
      historia: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching planning history:', error);
    res.status(500).json({ error: 'Failed to fetch planning history' });
  }
});

// POST /api/pallets/rules/apply/:pozycjaId - Zastosuj reguły do pozycji
router.post('/rules/apply/:pozycjaId', async (req, res) => {
  try {
    const { pozycjaId } = req.params;
    
    // Analizuj pozycję
    const analizaResult = await db.query(
      'SELECT * FROM zko_config.analizuj_pozycje_dla_palet($1)',
      [pozycjaId]
    );
    
    if (analizaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    const analiza = analizaResult.rows[0];
    
    // Wybierz regułę
    const regulaResult = await db.query(
      `SELECT * FROM zko_config.wybierz_regule_planowania($1, $2, $3, $4)`,
      [
        analiza.liczba_kolorow,
        analiza.kierunki,
        analiza.typy_formatek,
        analiza.ilosc_formatek
      ]
    );
    
    const regula = regulaResult.rows[0];
    
    // Pobierz ZKO ID
    const zkoResult = await db.query(
      'SELECT zko_id FROM zko.pozycje WHERE id = $1',
      [pozycjaId]
    );
    
    if (zkoResult.rows.length === 0) {
      return res.status(404).json({ error: 'ZKO not found for position' });
    }
    
    const zkoId = zkoResult.rows[0].zko_id;
    
    // Zapisz historię
    await db.query(`
      INSERT INTO zko_config.historia_planowania_palet 
      (zko_id, pozycja_id, zastosowana_regula_id, parametry_wejsciowe, wynik_planowania)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      zkoId,
      pozycjaId,
      regula.regula_id,
      JSON.stringify(analiza),
      JSON.stringify({
        liczba_palet: regula.liczba_palet,
        strategia: regula.strategia_grupowania
      })
    ]);
    
    // Zastosuj planowanie (wywołaj funkcję PostgreSQL)
    const max_wysokosc_cm = 144; // 1440mm / 10
    const planResult = await db.query(
      `SELECT * FROM zko.pal_planuj_inteligentnie_v3($1, $2, $3, $4, $5)`,
      [pozycjaId, 'system', max_wysokosc_cm, 700, 18]
    );
    
    res.json({
      sukces: true,
      analiza_pozycji: analiza,
      zastosowana_regula: regula,
      wynik_planowania: planResult.rows[0],
      komunikat: `Zastosowano regułę: ${regula.nazwa_reguly}`
    });
    
  } catch (error) {
    logger.error('Error applying rules:', error);
    res.status(500).json({ error: 'Failed to apply rules' });
  }
});

export default router;