import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from './logger';

// Standardowa obsługa błędów
export const handleError = (res: Response, error: any, operation: string) => {
  logger.error(`Error in ${operation}:`, {
    message: error.message,
    code: error.code,
    detail: error.detail,
    stack: error.stack,
  });

  // Błąd walidacji Zod
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.errors,
    });
  }

  // Błąd PostgreSQL
  if (error.code) {
    const message = getPostgresErrorMessage(error.code);
    return res.status(400).json({
      error: message,
      code: error.code,
      detail: error.detail,
    });
  }

  // Domyślny błąd
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: `Failed to ${operation}`,
    ...(isDev && {
      details: {
        message: error.message,
        code: error.code,
        detail: error.detail,
      },
    }),
  });
};

// Mapowanie kodów błędów PostgreSQL
const getPostgresErrorMessage = (code: string): string => {
  const errorMap: Record<string, string> = {
    '23505': 'Duplikat - rekord już istnieje',
    '23503': 'Naruszenie klucza obcego',
    '23502': 'Brak wymaganej wartości',
    '23514': 'Naruszenie ograniczenia CHECK',
    '22P02': 'Nieprawidłowy format danych',
  };
  
  return errorMap[code] || 'Błąd bazy danych';
};

// Middleware do walidacji schematów
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      handleError(res, error, 'validate request');
    }
  };
};