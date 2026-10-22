import rateLimit from 'express-rate-limit';

export const createRateLimiter = (maxRequests: number, windowMinutes: number) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Troppe richieste. Riprova tra qualche minuto.',
    },
    skip: (req) => {
      return process.env.NODE_ENV === 'test';
    },
  });
};
