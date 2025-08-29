import { z } from 'zod';

// Schemat tworzenia ZKO
export const CreateZKOSchema = z.object({
  kooperant: z.string().min(1),
  priorytet: z.number().min(1).max(10).default(5),
  komentarz: z.string().optional(),
});

// Schemat dodawania pozycji
export const AddPozycjaSchema = z.object({
  zko_id: z.number(),
  rozkroj_id: z.number(),
  kolory_plyty: z.array(z.object({
    plyta_id: z.number().optional(),
    kolor: z.string(),
    nazwa: z.string(),
    ilosc: z.number().positive(),
    stan_magazynowy: z.number().optional(),
    grubosc: z.union([z.number(), z.string()]).optional(),
  })),
  kolejnosc: z.number().optional().nullable(),
  uwagi: z.string().optional().nullable(),
});

// Schemat zmiany statusu
export const ChangeStatusSchema = z.object({
  zko_id: z.number(),
  nowy_etap_kod: z.string(),
  komentarz: z.string().optional(),
  operator: z.string().optional(),
  lokalizacja: z.string().optional(),
});

// Schemat usuwania pozycji
export const DeletePozycjaSchema = z.object({
  uzytkownik: z.string().optional().default('system'),
  powod: z.string().optional().nullable(),
  postgres_function: z.string().optional(),
});

// Schemat edycji pozycji
export const EditPozycjaSchema = z.object({
  rozkroj_id: z.number().optional(),
  ilosc_plyt: z.number().optional(),
  kolor_plyty: z.string().optional(),
  nazwa_plyty: z.string().optional(),
  kolejnosc: z.number().optional(),
  uwagi: z.string().optional().nullable(),
  uzytkownik: z.string().optional().default('system'),
});

// Schemat zakończenia zlecenia
export const CompleteZKOSchema = z.object({
  operator: z.string().optional(),
  komentarz: z.string().optional(),
});

// Schemat wywołania funkcji PostgreSQL
export const CallFunctionSchema = z.object({
  function: z.string().min(1),
  params: z.array(z.any()).optional(),
});