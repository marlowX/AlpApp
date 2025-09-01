import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import { logger } from './utils/logger';
import { handleError } from './utils/error-handler';

const router = Router();

/**
 * POST /api/zko/status/validate - Walidacja przed zmianą statusu
 * Wywołuje funkcję PostgreSQL: zko.waliduj_zmiane_statusu
 */
router.post('/status/validate', async (req: Request, res: Response) => {
  try {
    const { zko_id, nowy_etap_kod } = req.body;
    
    if (!zko_id || !nowy_etap_kod) {
      return res.status(400).json({
        error: 'Brak wymaganych parametrów: zko_id, nowy_etap_kod'
      });
    }
    
    logger.info('Validating status change:', { zko_id, nowy_etap_kod });
    
    const result = await db.query(
      `SELECT * FROM zko.waliduj_zmiane_statusu($1, $2)`,
      [zko_id, nowy_etap_kod]
    );
    
    const validation = result.rows[0];
    
    logger.info('Validation result:', validation);
    res.json(validation);
    
  } catch (error: any) {
    handleError(res, error, 'validate status change');
  }
});

/**
 * POST /api/zko/status/change - Zmiana statusu z walidacją
 * Wywołuje funkcję: zko.zmien_status_z_walidacja lub zko.zmien_status_v3
 */
router.post('/status/change', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    logger.info('Changing ZKO status with validation:', data);
    
    // Najpierw sprawdź walidację
    const validationResult = await db.query(
      `SELECT * FROM zko.waliduj_zmiane_statusu($1, $2)`,
      [data.zko_id, data.nowy_etap_kod]
    );
    
    const validation = validationResult.rows[0];
    
    // Jeśli są błędy krytyczne, zwróć je
    if (!validation.mozna_zmienic && !data.wymus) {
      return res.status(400).json({
        sukces: false,
        komunikat: validation.komunikat,
        bledy: validation.bledy || [],
        ostrzezenia: validation.ostrzezenia || []
      });
    }
    
    // Jeśli są ostrzeżenia i nie wymuszamy
    if (validation.ostrzezenia?.length > 0 && !data.wymus) {
      return res.status(200).json({
        sukces: false,
        wymaga_potwierdzenia: true,
        komunikat: 'Zmiana statusu wymaga potwierdzenia',
        bledy: [],
        ostrzezenia: validation.ostrzezenia
      });
    }
    
    // Wykonaj zmianę statusu
    const result = await db.query(
      `SELECT * FROM zko.zmien_status_v3($1, $2, $3, $4, $5, $6)`,
      [
        data.zko_id,
        data.nowy_etap_kod,
        data.uzytkownik || 'system',
        data.komentarz,
        data.operator,
        data.lokalizacja
      ]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      // Emisja zdarzenia WebSocket
      emitZKOUpdate(data.zko_id, 'zko:status:changed', {
        zko_id: data.zko_id,
        stary_status: response.stary_status,
        nowy_status: response.nowy_status,
      });
      logger.info('Status changed successfully:', response);
    }
    
    res.json({
      ...response,
      bledy: validation.bledy || [],
      ostrzezenia: validation.ostrzezenia || []
    });
    
  } catch (error: any) {
    handleError(res, error, 'change status');
  }
});

/**
 * PUT /api/zko/:id/edit - Edycja danych ZKO
 * Wywołuje funkcję PostgreSQL: zko.edytuj_zko
 */
router.put('/:id/edit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    logger.info(`Editing ZKO ${id}:`, data);
    
    // Konwertuj daty na format DATE PostgreSQL (bez czasu)
    const dataPlanowana = data.data_planowana ? 
      data.data_planowana.split('T')[0] : null;
    const dataOtrzymania = data.data_otrzymania ? 
      data.data_otrzymania.split('T')[0] : null;
    
    logger.info('Converted dates:', { dataPlanowana, dataOtrzymania });
    
    const result = await db.query(
      `SELECT * FROM zko.edytuj_zko($1, $2, $3, $4::DATE, $5::DATE, $6, $7)`,
      [
        id,
        data.kooperant,
        data.priorytet,
        dataPlanowana,
        dataOtrzymania,
        data.komentarz,
        data.uzytkownik || 'system'
      ]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      // Emisja zdarzenia WebSocket
      emitZKOUpdate(Number(id), 'zko:edited', {
        zko_id: Number(id),
        changes: data
      });
      logger.info('ZKO edited successfully');
    }
    
    res.json(response);
    
  } catch (error: any) {
    handleError(res, error, 'edit ZKO');
  }
});

/**
 * GET /api/zko/:id/status-validation - Pobierz status z informacją o blokadach
 * Wywołuje funkcję: zko.pobierz_status_z_walidacja
 */
router.get('/:id/status-validation', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    logger.info(`Getting status validation for ZKO ${id}`);
    
    // Najpierw pobierz możliwe przejścia
    const nextStepsResult = await db.query(
      `SELECT * FROM zko.pobierz_nastepne_etapy($1)`,
      [id]
    );
    
    const nextSteps = nextStepsResult.rows;
    
    // Dla każdego możliwego przejścia sprawdź walidację
    const validatedSteps = await Promise.all(
      nextSteps.map(async (step) => {
        const validationResult = await db.query(
          `SELECT * FROM zko.waliduj_zmiane_statusu($1, $2)`,
          [id, step.kod_etapu]
        );
        
        const validation = validationResult.rows[0];
        
        return {
          ...step,
          mozna_zmienic: validation.mozna_zmienic,
          komunikat_walidacji: validation.komunikat,
          bledy: validation.bledy || [],
          ostrzezenia: validation.ostrzezenia || []
        };
      })
    );
    
    // Pobierz podstawowe dane ZKO
    const zkoResult = await db.query(
      `SELECT z.*, 
              (SELECT COUNT(*) FROM zko.pozycje WHERE zko_id = z.id) as liczba_pozycji,
              (SELECT COUNT(*) FROM zko.palety p 
               JOIN zko.pozycje poz ON p.pozycja_id = poz.id 
               WHERE poz.zko_id = z.id) as liczba_palet
       FROM zko.zlecenia z
       WHERE z.id = $1`,
      [id]
    );
    
    const zko = zkoResult.rows[0];
    
    res.json({
      zko_id: Number(id),
      numer_zko: zko.numer_zko,
      status: zko.status,
      liczba_pozycji: zko.liczba_pozycji,
      liczba_palet: zko.liczba_palet,
      mozliwe_przejscia: validatedSteps,
      ma_blokady: validatedSteps.some(s => !s.mozna_zmienic)
    });
    
  } catch (error: any) {
    handleError(res, error, 'get status validation');
  }
});

export default router;