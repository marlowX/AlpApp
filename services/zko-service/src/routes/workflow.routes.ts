import { Router } from 'express';
import { db } from '../index';
import pino from 'pino';

const router: Router = Router();
const logger = pino();

// GET /api/workflow/instructions - Instrukcje workflow
router.get('/instructions', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM zko.v_instrukcja_workflow ORDER BY krok`
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching workflow instructions:', error);
    res.status(500).json({ error: 'Failed to fetch workflow instructions' });
  }
});

// GET /api/workflow/path - Ścieżka przepływu
router.get('/path', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM zko.v_sciezka_przeplywu ORDER BY kolejnosc`
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching workflow path:', error);
    res.status(500).json({ error: 'Failed to fetch workflow path' });
  }
});

// GET /api/workflow/etapy - Słownik etapów
router.get('/etapy', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM tracking.etapy_slownik WHERE aktywny = true ORDER BY kolejnosc`
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching etapy:', error);
    res.status(500).json({ error: 'Failed to fetch etapy' });
  }
});

// GET /api/workflow/statuses - Statusy palet
router.get('/statuses', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM zko.statusy_palet WHERE aktywny = true ORDER BY kolejnosc`
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching pallet statuses:', error);
    res.status(500).json({ error: 'Failed to fetch pallet statuses' });
  }
});

export default router;
