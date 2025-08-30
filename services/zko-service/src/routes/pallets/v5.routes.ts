import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import pino from 'pino';
import { z } from 'zod';

const router = Router();
const logger = pino();

// Schematy walidacji V5
const PlanowaniePaletV5Schema = z.object({
  strategia: z.enum(['inteligentna', 'kolor', 'rozmiar', 'oklejanie', 'mieszane', 'optymalizacja']).default('inteligentna'),
  max_wysokosc_mm: z.number().min(400).max(2000).default(1440),
  max_formatek_na_palete: z.number().min(50).max(500).default(200),
  max_waga_kg: z.number().min(100).max(1000).default(700),
  grubosc_plyty: z.number().min(10).max(40).default(18),
  typ_palety: z.enum(['EURO', 'STANDARD', 'MAXI']).default('EURO'),
  uwzglednij_oklejanie: z.boolean().default(true),
  nadpisz_istniejace: z.boolean().default(false),
  operator: z.string().optional().default('system')
});

const SmartDeleteSchema = z.object({
  palety_ids: z.array(z.number()).optional(),
  tylko_puste: z.boolean().default(false),
  force_usun: z.boolean().default(false),
  operator: z.string().default('system')
});

const ReorganizeSchema = z.object({
  strategia: z.enum(['optymalizacja', 'kolor', 'rozmiar']).default('optymalizacja'),
  operator: z.string().default('system')
});

/**
 * POST /api/pallets/zko/:zkoId/plan-v5 - NOWE PLANOWANIE V5
 * Używa funkcji pal_planuj_inteligentnie_v5
 */
router.post('/zko/:zkoId/plan-v5', async (req: Request, res: Response) => {
  let client;
  
  try {
    const zkoId = parseInt(req.params.zkoId);
    
    if (isNaN(zkoId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO',
        details: 'ID ZKO musi być liczbą'
      });
    }
    
    const params = PlanowaniePaletV5Schema.parse(req.body);
    
    client = await db.connect();
    
    logger.info(`Planning pallets V5 for ZKO ${zkoId} with strategy: ${params.strategia}`);
    
    // Wywołaj nową funkcję PostgreSQL V5
    const result = await client.query(`
      SELECT * FROM zko.pal_planuj_inteligentnie_v5($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      zkoId,
      params.strategia,
      params.max_wysokosc_mm,
      params.max_formatek_na_palete,
      params.max_waga_kg,
      params.grubosc_plyty,
      params.typ_palety,
      params.uwzglednij_oklejanie,
      params.operator,
      params.nadpisz_istniejace
    ]);
    
    const response = result.rows[0];
    
    if (response && response.sukces) {
      // Emit WebSocket update
      emitZKOUpdate(zkoId, 'pallets:planned-v5', {
        zko_id: zkoId,
        palety_utworzone: response.palety_utworzone,
        strategia: params.strategia,
        statystyki: response.statystyki
      });
      
      logger.info(`Successfully planned ${response.palety_utworzone?.length || 0} pallets for ZKO ${zkoId}`);
    }
    
    res.json(response || { 
      sukces: false, 
      komunikat: 'Brak odpowiedzi z funkcji planowania',
      palety_utworzone: [],
      plan_szczegolowy: {},
      statystyki: {}
    });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Błąd walidacji parametrów',
        details: error.errors
      });
    }
    
    logger.error('Error in V5 planning:', error);
    res.status(500).json({ 
      error: 'Błąd planowania palet V5',
      message: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * DELETE /api/pallets/zko/:zkoId/delete-smart - INTELIGENTNE USUWANIE V5
 * Używa funkcji pal_usun_inteligentnie
 */
router.delete('/zko/:zkoId/delete-smart', async (req: Request, res: Response) => {
  let client;
  
  try {
    const zkoId = parseInt(req.params.zkoId);
    
    if (isNaN(zkoId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO'
      });
    }
    
    const params = SmartDeleteSchema.parse(req.body);
    
    client = await db.connect();
    
    logger.info(`Smart deleting pallets for ZKO ${zkoId}`, params);
    
    // Wywołaj funkcję inteligentnego usuwania
    const result = await client.query(`
      SELECT * FROM zko.pal_usun_inteligentnie($1, $2, $3, $4, $5)
    `, [
      zkoId,
      params.palety_ids || null,
      params.tylko_puste,
      params.force_usun,
      params.operator
    ]);
    
    const response = result.rows[0];
    
    if (response && response.sukces) {
      // Emit WebSocket update
      emitZKOUpdate(zkoId, 'pallets:deleted-smart', {
        zko_id: zkoId,
        usuniete_palety: response.usuniete_palety,
        przeniesione_formatki: response.przeniesione_formatki
      });
      
      logger.info(`Smart deleted ${response.usuniete_palety?.length || 0} pallets for ZKO ${zkoId}`);
    }
    
    res.json(response || {
      sukces: false,
      komunikat: 'Błąd funkcji usuwania',
      usuniete_palety: [],
      przeniesione_formatki: 0,
      ostrzezenia: []
    });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Błąd walidacji',
        details: error.errors
      });
    }
    
    logger.error('Error in smart delete:', error);
    res.status(500).json({
      error: 'Błąd inteligentnego usuwania palet',
      message: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * POST /api/pallets/zko/:zkoId/reorganize - REORGANIZACJA V5
 * Używa funkcji pal_reorganizuj_v5
 */
router.post('/zko/:zkoId/reorganize', async (req: Request, res: Response) => {
  let client;
  
  try {
    const zkoId = parseInt(req.params.zkoId);
    
    if (isNaN(zkoId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO'
      });
    }
    
    const params = ReorganizeSchema.parse(req.body);
    
    client = await db.connect();
    
    logger.info(`Reorganizing pallets for ZKO ${zkoId} with strategy: ${params.strategia}`);
    
    // Wywołaj funkcję reorganizacji
    const result = await client.query(`
      SELECT * FROM zko.pal_reorganizuj_v5($1, $2, $3)
    `, [
      zkoId,
      params.strategia,
      params.operator
    ]);
    
    const response = result.rows[0];
    
    if (response && response.sukces) {
      // Emit WebSocket update
      emitZKOUpdate(zkoId, 'pallets:reorganized-v5', {
        zko_id: zkoId,
        strategia: params.strategia,
        przed: response.przed_reorganizacja,
        po: response.po_reorganizacji
      });
      
      logger.info(`Successfully reorganized pallets for ZKO ${zkoId}`);
    }
    
    res.json(response || {
      sukces: false,
      komunikat: 'Błąd funkcji reorganizacji'
    });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Błąd walidacji',
        details: error.errors
      });
    }
    
    logger.error('Error in reorganization:', error);
    res.status(500).json({
      error: 'Błąd reorganizacji palet',
      message: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * POST /api/pallets/clean-empty - CZYSZCZENIE PUSTYCH PALET V5
 * Używa funkcji pal_wyczysc_puste_v2
 */
router.post('/clean-empty', async (req: Request, res: Response) => {
  try {
    const { zko_id, operator } = req.body;
    
    logger.info(`Cleaning empty pallets for ZKO ${zko_id || 'ALL'}`);
    
    const result = await db.query(`
      SELECT * FROM zko.pal_wyczysc_puste_v2($1, $2)
    `, [
      zko_id || null,
      operator || 'system'
    ]);
    
    const response = result.rows[0];
    
    if (response && response.sukces && zko_id) {
      // Emit WebSocket update tylko jeśli dla konkretnego ZKO
      emitZKOUpdate(zko_id, 'pallets:cleaned', {
        zko_id: zko_id,
        usuniete: response.usuniete,
        szczegoly: response.szczegoly
      });
    }
    
    res.json(response || {
      sukces: false,
      komunikat: 'Błąd funkcji czyszczenia',
      usuniete: 0,
      szczegoly: {}
    });
    
  } catch (error: any) {
    logger.error('Error cleaning empty pallets:', error);
    res.status(500).json({
      error: 'Błąd czyszczenia pustych palet',
      message: error.message
    });
  }
});

/**
 * GET /api/pallets/stats/:zkoId - STATYSTYKI PALET V5
 */
router.get('/stats/:zkoId', async (req: Request, res: Response) => {
  try {
    const zkoId = parseInt(req.params.zkoId);
    
    if (isNaN(zkoId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO'
      });
    }
    
    // Pobierz szczegółowe statystyki
    const result = await db.query(`
      SELECT 
        COUNT(*) as liczba_palet,
        COALESCE(SUM(ilosc_formatek), 0) as formatki_total,
        COALESCE(AVG(wysokosc_stosu / 1440.0 * 100), 0) as srednie_wykorzystanie,
        COUNT(*) FILTER (WHERE COALESCE(ilosc_formatek, 0) = 0) as puste_palety,
        COUNT(*) FILTER (WHERE status = 'gotowa_do_transportu') as palety_gotowe,
        COALESCE(MAX(wysokosc_stosu / 1440.0 * 100), 0) as najwyzsze_wykorzystanie,
        COALESCE(MIN(CASE WHEN ilosc_formatek > 0 THEN wysokosc_stosu / 1440.0 * 100 END), 0) as najnizsze_wykorzystanie,
        COALESCE(SUM(waga_kg), 0) as total_waga,
        COALESCE(AVG(waga_kg), 0) as srednia_waga,
        string_agg(DISTINCT kolory_na_palecie, ', ') as wszystkie_kolory
      FROM zko.palety
      WHERE zko_id = $1
    `, [zkoId]);
    
    const stats = result.rows[0];
    
    res.json({
      sukces: true,
      statystyki: {
        liczba_palet: parseInt(stats.liczba_palet || 0),
        formatki_total: parseInt(stats.formatki_total || 0),
        srednie_wykorzystanie: Math.round(parseFloat(stats.srednie_wykorzystanie || 0)),
        puste_palety: parseInt(stats.puste_palety || 0),
        palety_gotowe: parseInt(stats.palety_gotowe || 0),
        najwyzsze_wykorzystanie: Math.round(parseFloat(stats.najwyzsze_wykorzystanie || 0)),
        najnizsze_wykorzystanie: Math.round(parseFloat(stats.najnizsze_wykorzystanie || 0)),
        total_waga: Math.round(parseFloat(stats.total_waga || 0)),
        srednia_waga: Math.round(parseFloat(stats.srednia_waga || 0)),
        wszystkie_kolory: stats.wszystkie_kolory
      }
    });
    
  } catch (error: any) {
    logger.error('Error getting pallet stats:', error);
    res.status(500).json({
      error: 'Błąd pobierania statystyk palet',
      message: error.message
    });
  }
});

/**
 * POST /api/pallets/transfer-v5 - ULEPSZONE PRZENOSZENIE FORMATEK
 * Używa funkcji pal_przesun_formatki z lepszą walidacją
 */
router.post('/transfer-v5', async (req: Request, res: Response) => {
  try {
    const {
      z_palety_id,
      na_palete_id,
      formatki_ids,
      ilosc_sztuk,
      operator,
      powod
    } = req.body;
    
    // Walidacja podstawowa
    if (!z_palety_id || !na_palete_id) {
      return res.status(400).json({
        error: 'Wymagane są ID palety źródłowej i docelowej'
      });
    }
    
    if (z_palety_id === na_palete_id) {
      return res.status(400).json({
        error: 'Paleta źródłowa i docelowa nie mogą być takie same'
      });
    }
    
    logger.info(`Transferring formatki from pallet ${z_palety_id} to ${na_palete_id}`);
    
    // Wywołaj funkcję PostgreSQL
    const result = await db.query(`
      SELECT * FROM zko.pal_przesun_formatki($1, $2, $3, $4, $5, $6)
    `, [
      z_palety_id,
      na_palete_id,
      formatki_ids || null,
      ilosc_sztuk || null,
      operator || 'system',
      powod || 'Przeniesienie formatek przez aplikację'
    ]);
    
    const response = result.rows[0];
    
    if (response && response.sukces) {
      // Pobierz ZKO ID dla WebSocket
      const zkoResult = await db.query(
        'SELECT DISTINCT zko_id FROM zko.palety WHERE id IN ($1, $2)',
        [z_palety_id, na_palete_id]
      );
      
      if (zkoResult.rows.length > 0) {
        const zkoId = zkoResult.rows[0].zko_id;
        emitZKOUpdate(zkoId, 'pallets:transfer-v5', {
          z_palety_id,
          na_palete_id,
          formatki_przeniesione: formatki_ids?.length || ilosc_sztuk || 0
        });
      }
    }
    
    res.json(response || {
      sukces: false,
      komunikat: 'Błąd funkcji przenoszenia',
      z_palety_info: {},
      na_palete_info: {}
    });
    
  } catch (error: any) {
    logger.error('Error transferring formatki:', error);
    res.status(500).json({
      error: 'Błąd przenoszenia formatek',
      message: error.message
    });
  }
});

/**
 * GET /api/pallets/functions/check - SPRAWDZENIE DOSTĘPNOŚCI FUNKCJI V5
 */
router.get('/functions/check', async (req: Request, res: Response) => {
  try {
    // Sprawdź dostępność funkcji V5
    const functions = await db.query(`
      SELECT routine_name, data_type
      FROM information_schema.routines
      WHERE routine_schema = 'zko'
      AND routine_name IN (
        'pal_planuj_inteligentnie_v5',
        'pal_usun_inteligentnie',
        'pal_reorganizuj_v5',
        'pal_wyczysc_puste_v2'
      )
      ORDER BY routine_name
    `);
    
    const availableFunctions = functions.rows.map(f => f.routine_name);
    const expectedFunctions = [
      'pal_planuj_inteligentnie_v5',
      'pal_usun_inteligentnie', 
      'pal_reorganizuj_v5',
      'pal_wyczysc_puste_v2'
    ];
    
    const missingFunctions = expectedFunctions.filter(
      name => !availableFunctions.includes(name)
    );
    
    res.json({
      sukces: missingFunctions.length === 0,
      dostepne_funkcje: availableFunctions,
      brakujace_funkcje: missingFunctions,
      wersja: 'V5',
      status: missingFunctions.length === 0 ? 'ready' : 'missing_functions'
    });
    
  } catch (error: any) {
    logger.error('Error checking V5 functions:', error);
    res.status(500).json({
      error: 'Błąd sprawdzania funkcji',
      message: error.message
    });
  }
});

export default router;