import { Router, Request, Response } from 'express';
import { db, emitZKOUpdate } from '../../index';
import pino from 'pino';
import { z } from 'zod';
import { PlanPalletsSchema, PlanPalletsForZKOSchema } from './schemas';

const router = Router();
const logger = pino();

/**
 * Helper - utworzenie domyślnych palet
 */
async function createDefaultPallets(
  client: any,
  zkoId: number,
  numerZko: string,
  liczba: number,
  params: any
): Promise<any[]> {
  const palety = [];
  
  for (let i = 0; i < liczba; i++) {
    const result = await client.query(
      `INSERT INTO zko.palety (
        zko_id, 
        numer_palety, 
        kierunek, 
        status,
        typ_palety,
        ilosc_formatek,
        wysokosc_stosu,
        waga_kg
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        zkoId,
        `PAL-${numerZko}-${String(i + 1).padStart(3, '0')}`,
        'wewnetrzny',
        'otwarta',
        params.typ_palety || 'EURO',
        0,
        0,
        0
      ]
    );
    palety.push(result.rows[0]);
  }
  
  return palety;
}

/**
 * POST /api/pallets/zko/:zkoId/plan - Planowanie palet dla całego ZKO
 * Używa funkcji PostgreSQL pal_planuj_inteligentnie_v4
 */
router.post('/zko/:zkoId/plan', async (req: Request, res: Response) => {
  let client;
  
  try {
    client = await db.connect();
    await client.query('BEGIN');
    
    // Konwersja zkoId na number
    const zkoId = parseInt(req.params.zkoId);
    
    if (isNaN(zkoId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Nieprawidłowe ID ZKO',
        details: 'ID ZKO musi być liczbą'
      });
    }
    
    const data = req.body;
    
    logger.info(`Planning pallets for ZKO ${zkoId} with params:`, data);
    
    // Walidacja parametrów
    const maxWagaKg = data.max_waga_kg || 700;
    const maxWysokoscMm = data.max_wysokosc_mm || 1440;
    const maxFormatkiNaPalete = data.max_formatek_na_palete || 200;
    const gruboscPlyty = data.grubosc_plyty || 18;
    const typPalety = data.typ_palety || 'EURO';
    const strategia = data.strategia || 'kolor';
    
    // Sprawdź czy są już palety
    const existingPallets = await client.query(
      'SELECT COUNT(*) as count FROM zko.palety WHERE zko_id = $1',
      [zkoId]
    );
    
    if (parseInt(existingPallets.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.json({
        sukces: false,
        komunikat: 'Palety już istnieją dla tego ZKO. Najpierw usuń istniejące palety.'
      });
    }
    
    // Pobierz informacje o ZKO
    const zkoData = await client.query(`
      SELECT 
        z.id as zko_id,
        z.numer_zko,
        COUNT(DISTINCT pf.id) as formatki_count,
        COUNT(DISTINCT p.id) as pozycje_count,
        COALESCE(SUM(pf.ilosc_planowana), 0) as total_ilosc,
        STRING_AGG(DISTINCT p.kolor_plyty, ', ') as kolory
      FROM zko.zlecenia z
      LEFT JOIN zko.pozycje p ON p.zko_id = z.id
      LEFT JOIN zko.pozycje_formatki pf ON pf.pozycja_id = p.id
      WHERE z.id = $1
      GROUP BY z.id, z.numer_zko
    `, [zkoId]);
    
    if (zkoData.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'ZKO nie znalezione',
        details: `Brak ZKO o ID: ${zkoId}`
      });
    }
    
    const zkoInfo = zkoData.rows[0];
    const formatkiCount = parseInt(zkoInfo.formatki_count || 0);
    const totalIlosc = parseInt(zkoInfo.total_ilosc || 0);
    
    logger.info(`ZKO ${zkoId}: ${formatkiCount} rodzajów formatek, ${totalIlosc} sztuk`);
    
    // Jeśli nie ma formatek - utwórz pustą paletę
    if (formatkiCount === 0 || totalIlosc === 0) {
      const palety = await createDefaultPallets(
        client, 
        zkoId, 
        zkoInfo.numer_zko, 
        1, 
        { typ_palety: typPalety }
      );
      
      await client.query('COMMIT');
      
      return res.json({
        sukces: true,
        komunikat: `Utworzono ${palety.length} pustą paletę`,
        palety: palety
      });
    }
    
    // Użyj funkcji PostgreSQL pal_planuj_inteligentnie_v4
    try {
      const planResult = await client.query(
        `SELECT * FROM zko.pal_planuj_inteligentnie_v4($1, $2, $3, $4)`,
        [zkoId, maxWysokoscMm, maxFormatkiNaPalete, gruboscPlyty]
      );
      
      if (planResult.rows.length === 0) {
        // Jeśli funkcja nie zwróciła wyników, utwórz pustą paletę
        const palety = await createDefaultPallets(
          client, 
          zkoId, 
          zkoInfo.numer_zko, 
          1, 
          { typ_palety: typPalety }
        );
        
        await client.query('COMMIT');
        
        return res.json({
          sukces: true,
          komunikat: `Utworzono ${palety.length} pustą paletę (brak planu z funkcji)`,
          palety: palety
        });
      }
      
      // Tworzenie palet na podstawie wyników funkcji
      const palety = [];
      
      for (const planRow of planResult.rows) {
        const numerPalety = `PAL-${zkoInfo.numer_zko}-${String(planRow.paleta_nr).padStart(3, '0')}`;
        
        // Wyciągnij ID formatek z JSON
        const formatki = planRow.formatki || [];
        const formatkiIds = [];
        
        if (Array.isArray(formatki)) {
          for (const f of formatki) {
            if (f.formatka_id) {
              // Dodaj tyle razy ile jest sztuk
              const ilosc = f.ilosc || 1;
              for (let i = 0; i < ilosc; i++) {
                formatkiIds.push(f.formatka_id);
              }
            }
          }
        }
        
        // Oblicz wagę palety (zakładamy 0.7 kg/m² dla płyty 18mm)
        const wagaPalety = Math.min(maxWagaKg, planRow.wysokosc_stosu * 0.7);
        
        const result = await client.query(
          `INSERT INTO zko.palety (
            zko_id,
            numer_palety,
            kierunek,
            status,
            typ_palety,
            formatki_ids,
            ilosc_formatek,
            wysokosc_stosu,
            waga_kg,
            kolory_na_palecie,
            uwagi
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            zkoId,
            numerPalety,
            planRow.kierunek || 'wewnetrzny',
            'otwarta',
            typPalety,
            formatkiIds,
            planRow.ilosc_formatek || 0,
            planRow.wysokosc_stosu || 0,
            wagaPalety,
            planRow.kolor,
            `Utworzono automatycznie: strategia=${strategia}, funkcja=pal_planuj_inteligentnie_v4`
          ]
        );
        
        palety.push(result.rows[0]);
        
        logger.info(`Created pallet ${numerPalety} with ${planRow.ilosc_formatek} formatki`);
      }
      
      await client.query('COMMIT');
      
      // Emit event
      emitZKOUpdate(zkoId, 'pallets:planned', {
        zko_id: zkoId,
        palety_utworzone: palety.map(p => p.id),
        liczba_palet: palety.length
      });
      
      logger.info(`Created ${palety.length} pallets for ZKO ${zkoId} using pal_planuj_inteligentnie_v4`);
      
      return res.json({
        sukces: true,
        komunikat: `Utworzono ${palety.length} palet używając inteligentnego planowania`,
        palety: palety,
        plan_szczegolowy: planResult.rows
      });
      
    } catch (funcError: any) {
      // Jeśli funkcja nie działa, użyj alternatywnego algorytmu
      logger.warn(`Function pal_planuj_inteligentnie_v4 failed: ${funcError.message}, using fallback`);
      
      // Pobierz formatki pogrupowane po kolorach
      const formatkiData = await client.query(`
        SELECT 
          pf.id,
          pf.nazwa_formatki,
          pf.dlugosc,
          pf.szerokosc,
          COALESCE(pf.ilosc_planowana, 0) as ilosc_planowana,
          p.kolor_plyty,
          p.id as pozycja_id
        FROM zko.pozycje_formatki pf
        JOIN zko.pozycje p ON pf.pozycja_id = p.id
        WHERE p.zko_id = $1
        ORDER BY p.kolor_plyty, pf.dlugosc DESC, pf.szerokosc DESC
      `, [zkoId]);
      
      // Algorytm paletyzacji (fallback)
      const palety = [];
      let paletaNr = 1;
      let currentIlosc = 0;
      let currentWysokosc = 0;
      let currentFormatki = [];
      let currentFormatkiIds = [];
      let currentKolor = null;
      
      for (const formatka of formatkiData.rows) {
        const iloscFormatki = parseInt(formatka.ilosc_planowana || 0);
        if (iloscFormatki === 0) continue;
        
        const wysokoscFormatki = iloscFormatki * gruboscPlyty;
        
        // Sprawdź czy trzeba utworzyć nową paletę
        const needNewPallet = 
          (currentFormatki.length > 0) && (
            (strategia === 'kolor' && currentKolor && currentKolor !== formatka.kolor_plyty) ||
            (currentIlosc + iloscFormatki > maxFormatkiNaPalete) ||
            (currentWysokosc + wysokoscFormatki > maxWysokoscMm)
          );
        
        if (needNewPallet) {
          // Zapisz obecną paletę
          const numerPalety = `PAL-${zkoInfo.numer_zko}-${String(paletaNr).padStart(3, '0')}`;
          
          const result = await client.query(
            `INSERT INTO zko.palety (
              zko_id,
              numer_palety,
              kierunek,
              status,
              typ_palety,
              formatki_ids,
              ilosc_formatek,
              wysokosc_stosu,
              waga_kg,
              kolory_na_palecie
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
              zkoId,
              numerPalety,
              'wewnetrzny',
              'otwarta',
              typPalety,
              currentFormatkiIds,
              currentIlosc,
              currentWysokosc,
              Math.min(maxWagaKg, currentWysokosc * 0.7),
              currentKolor
            ]
          );
          
          palety.push(result.rows[0]);
          paletaNr++;
          
          // Reset dla nowej palety
          currentFormatki = [];
          currentFormatkiIds = [];
          currentIlosc = 0;
          currentWysokosc = 0;
          currentKolor = null;
        }
        
        // Dodaj formatkę do obecnej palety
        currentFormatki.push(formatka);
        // Dodaj ID formatki tyle razy ile jest sztuk
        for (let i = 0; i < iloscFormatki; i++) {
          currentFormatkiIds.push(formatka.id);
        }
        currentIlosc += iloscFormatki;
        currentWysokosc += wysokoscFormatki;
        currentKolor = currentKolor || formatka.kolor_plyty;
      }
      
      // Zapisz ostatnią paletę jeśli ma formatki
      if (currentFormatki.length > 0) {
        const numerPalety = `PAL-${zkoInfo.numer_zko}-${String(paletaNr).padStart(3, '0')}`;
        
        const result = await client.query(
          `INSERT INTO zko.palety (
            zko_id,
            numer_palety,
            kierunek,
            status,
            typ_palety,
            formatki_ids,
            ilosc_formatek,
            wysokosc_stosu,
            waga_kg,
            kolory_na_palecie
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            zkoId,
            numerPalety,
            'wewnetrzny',
            'otwarta',
            typPalety,
            currentFormatkiIds,
            currentIlosc,
            currentWysokosc,
            Math.min(maxWagaKg, currentWysokosc * 0.7),
            currentKolor
          ]
        );
        
        palety.push(result.rows[0]);
      }
      
      // Jeśli nie utworzono żadnych palet, utwórz pustą
      if (palety.length === 0) {
        const defaultPalety = await createDefaultPallets(
          client, 
          zkoId, 
          zkoInfo.numer_zko, 
          1, 
          { typ_palety: typPalety }
        );
        palety.push(...defaultPalety);
      }
      
      await client.query('COMMIT');
      
      logger.info(`Created ${palety.length} pallets for ZKO ${zkoId} using fallback algorithm`);
      
      return res.json({
        sukces: true,
        komunikat: `Utworzono ${palety.length} palet (algorytm zastępczy)`,
        palety: palety
      });
    }
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Error planning pallets:', error);
    res.status(500).json({ 
      error: 'Błąd tworzenia palet',
      message: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * POST /api/pallets/plan - Planowanie palet dla pozycji
 */
router.post('/plan', async (req: Request, res: Response) => {
  try {
    const data = PlanPalletsSchema.parse(req.body);
    
    logger.info('Planning pallets for position:', data);
    
    // Sprawdź czy funkcja istnieje
    const checkFunction = await db.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'zko' 
      AND routine_name = 'pal_planuj_inteligentnie_v3'
    `);
    
    if (checkFunction.rows.length === 0) {
      return res.status(501).json({ 
        sukces: false,
        komunikat: 'Funkcja planowania palet nie jest dostępna'
      });
    }
    
    const result = await db.query(
      `SELECT * FROM zko.pal_planuj_inteligentnie_v3($1, $2, $3, $4, $5)`,
      [
        data.pozycja_id,
        null,
        data.max_wysokosc_cm || 60,
        data.max_waga_kg || 200,
        data.grubosc_mm || 18
      ]
    );
    
    const response = result.rows[0];
    
    if (response && response.sukces) {
      const zkoResult = await db.query(
        'SELECT zko_id FROM zko.pozycje WHERE id = $1',
        [data.pozycja_id]
      );
      
      if (zkoResult.rows.length > 0) {
        emitZKOUpdate(zkoResult.rows[0].zko_id, 'pallets:planned', {
          pozycja_id: data.pozycja_id,
          palety_utworzone: response.palety_utworzone,
        });
      }
    }
    
    res.json(response || { sukces: false, komunikat: 'Błąd planowania' });
  } catch (error: any) {
    logger.error('Error planning pallets:', error);
    res.status(500).json({ 
      error: 'Failed to plan pallets',
      details: error.message 
    });
  }
});

/**
 * GET /api/pallets/calculate - Obliczanie parametrów palety
 */
router.get('/calculate', async (req: Request, res: Response) => {
  try {
    const { pozycja_id, formatki_ids, max_wysokosc, max_waga } = req.query;
    
    if (!pozycja_id) {
      return res.status(400).json({ error: 'pozycja_id is required' });
    }
    
    const checkFunction = await db.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'zko' 
      AND routine_name = 'pal_oblicz_parametry_v4'
    `);
    
    if (checkFunction.rows.length === 0) {
      return res.json({
        kolor_grupa: 'nieznany',
        liczba_formatek: 0,
        powierzchnia_m2: 0,
        waga_kg: max_waga || 700,
        wysokosc_stosu: 0,
        czy_przekroczona_wysokosc: false,
        czy_przekroczona_waga: false,
        sugerowana_liczba_palet: 1
      });
    }
    
    const formatki = formatki_ids ? 
      (Array.isArray(formatki_ids) ? formatki_ids : [formatki_ids]).map(Number) : 
      null;
    
    const result = await db.query(
      `SELECT * FROM zko.pal_oblicz_parametry_v4($1, $2, $3, $4)`,
      [
        Number(pozycja_id),
        formatki,
        max_wysokosc ? Number(max_wysokosc) : 180,
        max_waga ? Number(max_waga) : 700
      ]
    );
    
    res.json(result.rows[0] || {
      kolor_grupa: 'nieznany',
      liczba_formatek: 0,
      powierzchnia_m2: 0,
      waga_kg: max_waga || 700,
      wysokosc_stosu: 0,
      czy_przekroczona_wysokosc: false,
      czy_przekroczona_waga: false,
      sugerowana_liczba_palet: 1
    });
  } catch (error: any) {
    logger.error('Error calculating pallet parameters:', error);
    res.status(500).json({ 
      error: 'Failed to calculate parameters',
      details: error.message
    });
  }
});

export default router;