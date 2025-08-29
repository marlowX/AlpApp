import pino from 'pino';

// Konfiguracja loggera
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});

// Helper do logowania błędów
export const logError = (message: string, error: any, context?: any) => {
  logger.error({
    message,
    error: {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
      stack: error.stack,
    },
    context,
  });
};