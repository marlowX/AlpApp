import { Router, Request, Response } from 'express';
import { db } from '../../index';
import pino from 'pino';

const router = Router();
const logger = pino();

/**
 * GET /api/pallets/zko/:zkoId/details - Pobieranie szczegółów palet z ilościami
 * Używa nowej tabeli palety_formatki_ilosc
 */
router.get('/zko/:zkoId/details', async (req: Request, res: Response) => {
  try {
    const zkoId = parseInt(req.params.zkoId);
    
    if (isNaN(zkoId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO'
      });
    }
    
    logger.info(`Fetching detailed pallets for ZKO ${zkoId}`);
    
    // Pobierz palety z ilościami i informacjami o pozycjach
    // POPRAWIONE: Wyciągamy kolor z nazwy formatki, nie z pozycji
    const result = await db.query(`
      SELECT 
        p.id,
        p.numer_palety,
        p.status,
        p.kierunek,
        p.typ_palety,
        p.przeznaczenie,
        p.ilosc_formatek as sztuk_total,
        p.wysokosc_stosu,
        p.waga_kg,
        p.created_at,
        p.updated_at,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'formatka_id', pfi.formatka_id,
              'pozycja_id', pf.pozycja_id,
              'ilosc', pfi.ilosc,
              'nazwa_formatki', pf.nazwa_formatki,
              'dlugosc', pf.dlugosc,
              'szerokosc', pf.szerokosc,
              -- Wyciągnij kolor z nazwy formatki (np. "494x368 - BIALY" -> "BIALY")
              'kolor', CASE 
                WHEN pf.nazwa_formatki LIKE '% - %' 
                THEN TRIM(SPLIT_PART(pf.nazwa_formatki, ' - ', 2))
                ELSE 'NIEZNANY'
              END,
              -- Wyciągnij wymiary z nazwy formatki
              'wymiary', SPLIT_PART(pf.nazwa_formatki, ' - ', 1),
              -- Nazwa płyty odpowiednia dla koloru
              'nazwa_plyty', CASE 
                WHEN pf.nazwa_formatki LIKE '% - BIALY' THEN '18_BIALY'
                WHEN pf.nazwa_formatki LIKE '% - WOTAN' THEN '18_WOTAN'
                WHEN pf.nazwa_formatki LIKE '% - SONOMA' THEN '18_SONOMA'
                WHEN pf.nazwa_formatki LIKE '% - CZARNY' THEN '18_CZARNY'
                WHEN pf.nazwa_formatki LIKE '% - SZARY' THEN '18_SZARY'
                ELSE CONCAT('18_', TRIM(SPLIT_PART(pf.nazwa_formatki, ' - ', 2)))
              END
            ) ORDER BY pf.pozycja_id, pf.id
          ) FILTER (WHERE pfi.formatka_id IS NOT NULL),
          '[]'::jsonb
        ) as formatki_szczegoly,
        COALESCE(
          STRING_AGG(
            DISTINCT 'Poz.' || pf.pozycja_id::text,
            ', ' ORDER BY 'Poz.' || pf.pozycja_id::text
          ),
          ''
        ) as pozycje_lista,
        -- Kolory wyciągnięte z nazw formatek, nie z pozycji
        COALESCE(
          STRING_AGG(
            DISTINCT CASE 
              WHEN pf.nazwa_formatki LIKE '% - %' 
              THEN TRIM(SPLIT_PART(pf.nazwa_formatki, ' - ', 2))
              ELSE NULL
            END,
            ', '
          ),
          ''
        ) as kolory_na_palecie
      FROM zko.palety p
      LEFT JOIN zko.palety_formatki_ilosc pfi ON pfi.paleta_id = p.id
      LEFT JOIN zko.pozycje_formatki pf ON pf.id = pfi.formatka_id
      LEFT JOIN zko.pozycje poz ON poz.id = pf.pozycja_id
      WHERE p.zko_id = $1
      GROUP BY p.id
      ORDER BY p.numer_palety
    `, [zkoId]);
    
    // Pobierz podsumowanie ZKO
    const summaryResult = await db.query(`
      SELECT 
        COUNT(DISTINCT pf.id) as typy_formatek,
        SUM(pf.ilosc_planowana) as sztuk_total,
        SUM(pf.ilosc_wyprodukowana) as sztuk_wyprodukowanych,
        COUNT(DISTINCT p.id) as liczba_pozycji,
        SUM(CASE 
          WHEN pf.ilosc_planowana IS NOT NULL 
          THEN pf.ilosc_planowana * COALESCE(
            (pf.dlugosc * pf.szerokosc * 18 * 0.00072) / 1000000,
            0.7
          )
          ELSE 0 
        END) as waga_total
      FROM zko.pozycje p
      LEFT JOIN zko.pozycje_formatki pf ON pf.pozycja_id = p.id
      WHERE p.zko_id = $1
    `, [zkoId]);
    
    res.json({
      sukces: true,
      palety: result.rows,
      podsumowanie: summaryResult.rows[0],
      wersja: 'v2_with_quantities_and_positions'
    });
    
  } catch (error: any) {
    logger.error('Error fetching pallet details:', error);
    res.status(500).json({
      error: 'Błąd pobierania szczegółów palet',
      message: error.message
    });
  }
});

/**
 * POST /api/pallets/:paletaId/update-quantities - Aktualizacja ilości na palecie
 */
router.post('/:paletaId/update-quantities', async (req: Request, res: Response) => {
  let client;
  
  try {
    const paletaId = parseInt(req.params.paletaId);
    const { formatki } = req.body; // Array of {formatka_id, ilosc}
    
    if (isNaN(paletaId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID palety'
      });
    }
    
    client = await db.connect();
    await client.query('BEGIN');
    
    // Usuń stare wpisy
    await client.query(
      'DELETE FROM zko.palety_formatki_ilosc WHERE paleta_id = $1',
      [paletaId]
    );
    
    // Dodaj nowe wpisy
    let totalSztuk = 0;
    let totalWysokosc = 0;
    let totalWaga = 0;
    const formatkiIds = [];
    
    for (const item of formatki) {
      if (item.ilosc > 0) {
        await client.query(
          `INSERT INTO zko.palety_formatki_ilosc (paleta_id, formatka_id, ilosc)
           VALUES ($1, $2, $3)`,
          [paletaId, item.formatka_id, item.ilosc]
        );
        
        formatkiIds.push(item.formatka_id);
        totalSztuk += item.ilosc;
        totalWysokosc += item.ilosc * 18; // zakładamy 18mm
        totalWaga += item.ilosc * 0.7; // zakładamy 0.7kg
      }
    }
    
    // Zaktualizuj paletę
    await client.query(
      `UPDATE zko.palety 
       SET formatki_ids = $1,
           ilosc_formatek = $2,
           wysokosc_stosu = $3,
           waga_kg = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [formatkiIds, totalSztuk, totalWysokosc, totalWaga, paletaId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      sukces: true,
      komunikat: 'Zaktualizowano ilości na palecie',
      sztuk_total: totalSztuk,
      wysokosc_mm: totalWysokosc,
      waga_kg: totalWaga
    });
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Error updating pallet quantities:', error);
    res.status(500).json({
      error: 'Błąd aktualizacji ilości',
      message: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

export default router;