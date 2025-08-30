import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import pino from 'pino';
import { z } from 'zod';

const router = Router();
const logger = pino();

// Schema walidacji dla planowania modularnego
const PlanowanieModularneSchema = z.object({
  max_wysokosc_mm: z.number().min(400).max(2000).default(1440),
  max_formatek_na_palete: z.number().min(50).max(500).default(80),
  nadpisz_istniejace: z.boolean().default(false),
  operator: z.string().optional().default('system'),
  strategia: z.enum(['modular', 'kolory']).default('modular')  // 🆕 NOWA OPCJA
});

/**
 * POST /api/pallets/zko/:zkoId/plan-modular - POPRAWNE PLANOWANIE Z ILOŚCIAMI
 * Używa funkcji pal_planuj_modularnie + wypełnia palety_formatki_ilosc
 * 🆕 NOWA OPCJA: strategia 'kolory' dla grupowania po kolorach
 */
router.post('/zko/:zkoId/plan-modular', async (req: Request, res: Response) => {
  let client;
  
  try {
    const zkoId = parseInt(req.params.zkoId);
    
    if (isNaN(zkoId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO',
        details: 'ID ZKO musi być liczbą'
      });
    }
    
    const params = PlanowanieModularneSchema.parse(req.body);
    
    client = await db.connect();
    await client.query('BEGIN');
    
    logger.info(`Modular planning for ZKO ${zkoId} with strategy: ${params.strategia}`);
    
    // 🆕 WYBIERZ STRATEGIĘ PLANOWANIA
    let planResult;
    if (params.strategia === 'kolory') {
      // KROK 1A: Użyj funkcji grupowania po kolorach
      planResult = await client.query(`
        SELECT * FROM zko.pal_planuj_z_kolorami($1, $2, $3, $4)
      `, [
        zkoId,
        params.max_wysokosc_mm,
        params.max_formatek_na_palete,
        params.nadpisz_istniejace
      ]);
    } else {
      // KROK 1B: Użyj standardowej funkcji modularnej
      planResult = await client.query(`
        SELECT * FROM zko.pal_planuj_modularnie($1, $2, $3, $4)
      `, [
        zkoId,
        params.max_wysokosc_mm,
        params.max_formatek_na_palete,
        params.nadpisz_istniejace
      ]);
    }
    
    const response = planResult.rows[0];
    
    if (!response || !response.sukces) {
      await client.query('ROLLBACK');
      return res.json(response || {
        sukces: false,
        komunikat: 'Błąd funkcji planowania modularnego'
      });
    }

    // 🆕 DLA STRATEGII KOLORY - pobierz szczegóły od razu (funkcja już wypełniła tabelę)
    if (params.strategia === 'kolory') {
      await client.query('COMMIT');
      
      const paletyIds = response.palety_utworzone;
      
      // Pobierz szczegółowe dane z ilościami
      const detailsResult = await client.query(`
        SELECT 
          p.id,
          p.numer_palety,
          p.ilosc_formatek as sztuk_total,
          p.wysokosc_stosu,
          p.waga_kg,
          p.kolory_na_palecie,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'formatka_id', pfi.formatka_id,
                'ilosc', pfi.ilosc,
                'nazwa', pf.nazwa_formatki,
                'dlugosc', pf.dlugosc,
                'szerokosc', pf.szerokosc,
                'kolor', TRIM(SPLIT_PART(pf.nazwa_formatki, ' - ', 2))
              ) ORDER BY pf.id
            ) FILTER (WHERE pfi.formatka_id IS NOT NULL),
            '[]'::jsonb
          ) as formatki_szczegoly
        FROM zko.palety p
        LEFT JOIN zko.palety_formatki_ilosc pfi ON pfi.paleta_id = p.id
        LEFT JOIN zko.pozycje_formatki pf ON pf.id = pfi.formatka_id
        WHERE p.id = ANY($1)
        GROUP BY p.id, p.numer_palety, p.ilosc_formatek, p.wysokosc_stosu, p.waga_kg, p.kolory_na_palecie
        ORDER BY p.numer_palety
      `, [paletyIds]);
      
      const responseData = {
        sukces: true,
        komunikat: response.komunikat,
        palety_utworzone: paletyIds,
        palety_szczegoly: detailsResult.rows,
        statystyki: response.statystyki,
        strategia: 'kolory',
        wersja: 'modular_v2_colors'
      };
      
      // WebSocket update
      emitZKOUpdate(zkoId, 'pallets:planned-colors', {
        zko_id: zkoId,
        palety_utworzone: paletyIds,
        total_palet: paletyIds.length,
        strategia: 'kolory'
      });
      
      logger.info(`Successfully created ${paletyIds.length} color-grouped pallets for ZKO ${zkoId}`);
      
      return res.json(responseData);
    }
    
    // STANDARDOWE PLANOWANIE MODULARNIE (bez kolorów)
    // KROK 2: Pobierz dane o formatek ZKO
    const formatkiResult = await client.query(`
      SELECT 
        pf.id,
        pf.ilosc_planowana,
        pf.nazwa_formatki,
        p.kolor_plyty,
        pf.dlugosc,
        pf.szerokosc
      FROM zko.pozycje_formatki pf
      JOIN zko.pozycje p ON p.id = pf.pozycja_id
      WHERE p.zko_id = $1
      ORDER BY pf.id
    `, [zkoId]);
    
    const formatki = formatkiResult.rows;
    const totalSztuk = formatki.reduce((sum, f) => sum + f.ilosc_planowana, 0);
    
    logger.info(`Found ${formatki.length} formatki types with total ${totalSztuk} pieces`);
    
    // KROK 3: Wypełnij tabele palety_formatki_ilosc proporcjonalnie
    const paletyIds = response.palety_utworzone;
    
    for (const paletaId of paletyIds) {
      // Pobierz dane palety
      const paletaResult = await client.query(
        'SELECT ilosc_formatek FROM zko.palety WHERE id = $1',
        [paletaId]
      );
      
      const sztukiNaPalecie = paletaResult.rows[0]?.ilosc_formatek || 0;
      
      if (sztukiNaPalecie === 0) continue;
      
      // Oblicz proporcje i dodaj formatki do palety
      let pozostaloSztuk = sztukiNaPalecie;
      const formatkiNaPalecie = [];
      
      for (let i = 0; i < formatki.length; i++) {
        const formatka = formatki[i];
        let iloscNaPalecie;
        
        if (i === formatki.length - 1) {
          // Ostatnia formatka - dodaj resztę
          iloscNaPalecie = pozostaloSztuk;
        } else {
          // Oblicz proporcjonalnie
          const proporcja = formatka.ilosc_planowana / totalSztuk;
          iloscNaPalecie = Math.round(sztukiNaPalecie * proporcja);
          
          // Zabezpieczenie przed przekroczeniem
          if (iloscNaPalecie > pozostaloSztuk) {
            iloscNaPalecie = pozostaloSztuk;
          }
        }
        
        if (iloscNaPalecie > 0) {
          await client.query(
            `INSERT INTO zko.palety_formatki_ilosc (paleta_id, formatka_id, ilosc)
             VALUES ($1, $2, $3)`,
            [paletaId, formatka.id, iloscNaPalecie]
          );
          
          formatkiNaPalecie.push({
            formatka_id: formatka.id,
            ilosc: iloscNaPalecie,
            nazwa: formatka.nazwa_formatki
          });
          
          pozostaloSztuk -= iloscNaPalecie;
        }
      }
      
      logger.info(`Paleta ${paletaId}: added ${formatkiNaPalecie.length} formatki types, remaining: ${pozostaloSztuk}`);
    }
    
    await client.query('COMMIT');
    
    // KROK 4: Pobierz szczegółowe dane dla odpowiedzi
    const detailsResult = await client.query(`
      SELECT 
        p.id,
        p.numer_palety,
        p.ilosc_formatek as sztuk_total,
        p.wysokosc_stosu,
        p.waga_kg,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'formatka_id', pfi.formatka_id,
              'ilosc', pfi.ilosc,
              'nazwa', pf.nazwa_formatki,
              'dlugosc', pf.dlugosc,
              'szerokosc', pf.szerokosc,
              'kolor', CASE 
                WHEN pf.nazwa_formatki LIKE '%-%' 
                THEN TRIM(SPLIT_PART(pf.nazwa_formatki, ' - ', 2))
                ELSE 'BRAK_KOLORU'
              END
            ) ORDER BY pf.id
          ) FILTER (WHERE pfi.formatka_id IS NOT NULL),
          '[]'::jsonb
        ) as formatki_szczegoly
      FROM zko.palety p
      LEFT JOIN zko.palety_formatki_ilosc pfi ON pfi.paleta_id = p.id
      LEFT JOIN zko.pozycje_formatki pf ON pf.id = pfi.formatka_id
      WHERE p.id = ANY($1)
      GROUP BY p.id
      ORDER BY p.numer_palety
    `, [paletyIds]);
    
    const responseData = {
      sukces: true,
      komunikat: response.komunikat,
      palety_utworzone: paletyIds,
      palety_szczegoly: detailsResult.rows,
      statystyki: response.statystyki,
      formatki_info: {
        typy_formatek: formatki.length,
        total_sztuk: totalSztuk
      },
      strategia: 'modular',
      wersja: 'modular_v1_with_quantities'
    };
    
    // WebSocket update
    emitZKOUpdate(zkoId, 'pallets:planned-modular', {
      zko_id: zkoId,
      palety_utworzone: paletyIds,
      total_palet: paletyIds.length,
      total_sztuk: totalSztuk,
      strategia: 'modular'
    });
    
    logger.info(`Successfully created ${paletyIds.length} pallets with proper quantities for ZKO ${zkoId}`);
    
    res.json(responseData);
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Błąd walidacji parametrów',
        details: error.errors
      });
    }
    
    logger.error('Error in modular planning:', error);
    res.status(500).json({ 
      error: 'Błąd planowania modularnego',
      message: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * GET /api/pallets/zko/:zkoId/check-quantities - Sprawdzenie poprawności ilości
 */
router.get('/zko/:zkoId/check-quantities', async (req: Request, res: Response) => {
  try {
    const zkoId = parseInt(req.params.zkoId);
    
    if (isNaN(zkoId)) {
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO'
      });
    }
    
    // Sprawdź podsumowanie formatek w ZKO
    const zkoSummary = await db.query(`
      SELECT 
        COUNT(pf.id) as typy_formatek,
        SUM(pf.ilosc_planowana) as total_sztuk_zko
      FROM zko.pozycje_formatki pf
      JOIN zko.pozycje p ON p.id = pf.pozycja_id
      WHERE p.zko_id = $1
    `, [zkoId]);
    
    // Sprawdź podsumowanie formatek na paletach
    const paletySum = await db.query(`
      SELECT 
        COUNT(DISTINCT p.id) as liczba_palet,
        SUM(p.ilosc_formatek) as total_sztuk_palety,
        COUNT(pfi.id) as wpisy_ilosc_tabela,
        SUM(pfi.ilosc) as total_sztuk_ilosc_tabela
      FROM zko.palety p
      LEFT JOIN zko.palety_formatki_ilosc pfi ON pfi.paleta_id = p.id
      WHERE p.zko_id = $1
    `, [zkoId]);
    
    // Sprawdź szczegółowo każdą paletę
    const paletyDetails = await db.query(`
      SELECT 
        p.id,
        p.numer_palety,
        p.ilosc_formatek as sztuk_paleta,
        COALESCE(SUM(pfi.ilosc), 0) as sztuk_ilosc_tabela,
        COUNT(pfi.id) as formatki_count
      FROM zko.palety p
      LEFT JOIN zko.palety_formatki_ilosc pfi ON pfi.paleta_id = p.id
      WHERE p.zko_id = $1
      GROUP BY p.id, p.numer_palety, p.ilosc_formatek
      ORDER BY p.numer_palety
    `, [zkoId]);
    
    const zko = zkoSummary.rows[0];
    const palety = paletySum.rows[0];
    
    // Sprawdź czy ilości się zgadzają
    const zgodnosc = {
      zko_vs_palety: parseInt(zko.total_sztuk_zko || 0) === parseInt(palety.total_sztuk_palety || 0),
      palety_vs_ilosc: parseInt(palety.total_sztuk_palety || 0) === parseInt(palety.total_sztuk_ilosc_tabela || 0),
      tabela_ilosc_wypelniona: parseInt(palety.wpisy_ilosc_tabela || 0) > 0
    };
    
    const wszystkoOk = zgodnosc.zko_vs_palety && zgodnosc.palety_vs_ilosc && zgodnosc.tabela_ilosc_wypelniona;
    
    res.json({
      sukces: true,
      zgodnosc_ilosci: wszystkoOk,
      podsumowanie: {
        zko: {
          typy_formatek: parseInt(zko.typy_formatek || 0),
          total_sztuk: parseInt(zko.total_sztuk_zko || 0)
        },
        palety: {
          liczba_palet: parseInt(palety.liczba_palet || 0),
          total_sztuk: parseInt(palety.total_sztuk_palety || 0)
        },
        tabela_ilosc: {
          wpisy: parseInt(palety.wpisy_ilosc_tabela || 0),
          total_sztuk: parseInt(palety.total_sztuk_ilosc_tabela || 0)
        }
      },
      zgodnosc,
      palety_szczegoly: paletyDetails.rows,
      status: wszystkoOk ? 'OK' : 'NEEDS_FIX'
    });
    
  } catch (error: any) {
    logger.error('Error checking quantities:', error);
    res.status(500).json({
      error: 'Błąd sprawdzania ilości',
      message: error.message
    });
  }
});

export default router;