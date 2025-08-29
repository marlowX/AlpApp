import { z } from 'zod';

// Schemat planowania palet dla pozycji
export const PlanPalletsSchema = z.object({
  pozycja_id: z.number(),
  max_wysokosc_cm: z.number().default(180),
  max_waga_kg: z.number().default(700),
  grubosc_mm: z.number().default(18),
});

// Schemat planowania palet dla całego ZKO
export const PlanPalletsForZKOSchema = z.object({
  max_wysokosc_mm: z.number().default(1440),
  max_formatek_na_palete: z.number().default(200),
  grubosc_plyty: z.number().default(18),
  strategia: z.enum(['kolor', 'rozmiar', 'mieszane']).default('kolor'),
  typ_palety: z.enum(['EURO', 'STANDARD', 'MAXI']).default('EURO'),
});

// Schemat zamykania palety
export const ClosePalletSchema = z.object({
  operator: z.string().optional(),
  uwagi: z.string().optional(),
});

// Schemat reorganizacji palet
export const ReorganizePalletSchema = z.object({
  z_palety_id: z.number(),
  na_palete_id: z.number(),
  formatki_ids: z.array(z.number()).optional(),
  operator: z.string().optional(),
  powod: z.string().optional(),
});

// Schemat zmiany ilości palet
export const ChangeQuantitySchema = z.object({
  nowa_ilosc: z.number().min(1).max(50),
});