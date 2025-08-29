import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import pino from 'pino';
import { z } from 'zod';
import { ChangeQuantitySchema } from './schemas';

const router = Router();
const logger = pino();

/**
 * GET /api/pallets/zko/:zkoId - Lista palet dla ZKO
 */
router.get('/zko/:zkoId', async (req: Request, res: Response) => {
  try {
    const { zkoId } = req.params;
    
    logger.info(`Fetching pallets for ZKO ${zkoId}`);
    
    const result = await db.query(
      `SELECT 
        p.*, 
        sp.nazwa as status_nazwa, 
        sp.opis as status_opis,
        COUNT(DISTINCT pf.formatka_id) as ilosc_formatek,
        SUM(pf.wysokosc_stosu) as wysokosc_stosu,
        STRING_AGG(DISTINCT pf.kolor, ', ') as kolory_na_palecie,
        ARRAY_AGG(pf.formatka_id) as formatki_ids
       FROM zko.palety p
       LEFT JOIN zko.statusy_palet sp ON p.status = sp.kod_statusu
       LEFT JOIN LATERAL (
         SELECT 
           pozf.id as formatka_id,
           pozf.nazwa_formatki,
           poz.kolor_plyty as kolor,
           (pozf.ilosc_planowana * COALESCE(pl.grubosc, 18)) as wysokosc_stosu
         FROM zko.pozycje poz
         JOIN zko.pozycje_formatki pozf ON pozf.pozycja_id = poz.id
         LEFT JOIN public.plyty pl ON poz.plyty_id = pl.id
         WHERE poz.zko_id = p.zko_id
           AND pozf.paleta_id = p.id
       ) pf ON TRUE
       WHERE p.zko_id = $1
       GROUP BY p.id, p.numer_palety, p.typ, p.status, p.kierunek, 
                p.created_at, p.updated_at, p.zko_id, sp.nazwa, sp.opis
       ORDER BY p.id`,
      [zkoId]
    );
    
    res.json({ 
      palety: result.rows.map(row => ({
        ...row,
        wysokosc_stosu: row.wysokosc_stosu ? Math.round(row.wysokosc_stosu) : 0,
        ilosc_formatek: parseInt(row.ilosc_formatek) || 0
      }))
    });
  } catch (error: any) {
    logger.error('Error fetching pallets for ZKO:', error);
    res.status(500).json({ error: 'Failed to fetch pallets' });
  }
});

/**
 * GET /api/pallets/zko/:zkoId/summary - Podsumowanie palet dla ZKO
 */
router.get('/zko/:zkoId/summary', async (req: Request, res: Response) => {
  try {
    const { zkoId } = req.params;
    
    logger.info(`Fetching pallet summary for ZKO ${zkoId}`);
    
    const result = await db.query(`
      SELECT 
        COUNT(DISTINCT p.id) as liczba_palet,
        COUNT(DISTINCT CASE WHEN p.status = 'otwarta' THEN p.id END) as palety_otwarte,
        COUNT(DISTINCT CASE WHEN p.status = 'zamknieta' THEN p.id END) as palety_zamkniete,
        COUNT(DISTINCT pf.id) as liczba_formatek,
        SUM(pf.ilosc_planowana) as sztuk_formatek,
        AVG(
          (SELECT SUM(pf2.ilosc_planowana * COALESCE(pl.grubosc, 18))
           FROM zko.pozycje_formatki pf2
           LEFT JOIN zko.pozycje poz ON pf2.pozycja_id = poz.id
           LEFT JOIN public.plyty pl ON poz.plyty_id = pl.id
           WHERE pf2.paleta_id = p.id)
        ) as srednia_wysokosc,
        MAX(
          (SELECT SUM(pf2.ilosc_planowana * COALESCE(pl.grubosc, 18))
           FROM zko.pozycje_formatki pf2
           LEFT JOIN zko.pozycje poz ON pf2.pozycja_id = poz.id
           LEFT JOIN public.plyty pl ON poz.plyty_id = pl.id
           WHERE pf2.paleta_id = p.id)
        ) as max_wysokosc,
        STRING_AGG(DISTINCT poz.kolor_plyty, ', ') as kolory
      FROM zko.palety p
      LEFT JOIN zko.pozycje_formatki pf ON pf.paleta_id = p.id
      LEFT JOIN zko.pozycje poz ON pf.pozycja_id = poz.id
      WHERE p.zko_id = $1
    `, [zkoId]);
    
    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error fetching pallet summary:', error);
    res.status(500).json({ error: 'Failed to fetch pallet summary' });
  }
});

/**
 * POST /api/pallets/zko/:zkoId/change-quantity - Zmiana ilości palet
 * Wywołuje: zko.pal_zmien_ilosc_palet
 */
router.post('/zko/:zkoId/change-quantity', async (req: Request, res: Response) => {
  try {
    const { zkoId } = req.params;
    const data = ChangeQuantitySchema.parse(req.body);
    
    logger.info(`Changing pallet quantity for ZKO ${zkoId} to ${data.nowa_ilosc}`);
    
    const result = await db.query(
      `SELECT * FROM zko.pal_zmien_ilosc_palet($1, $2)`,
      [zkoId, data.nowa_ilosc]
    );
    
    const response = result.rows[0];
    
    if (response.sukces) {
      emitZKOUpdate(Number(zkoId), 'pallets:quantity:changed', {
        zko_id: Number(zkoId),
        nowa_ilosc: data.nowa_ilosc,
        komunikat: response.komunikat
      });
    }
    
    res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    logger.error('Error changing pallet quantity:', error);
    res.status(500).json({ error: 'Failed to change pallet quantity' });
  }
});

export default router;