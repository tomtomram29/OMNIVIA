import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route non trovata: ${req.method} ${req.originalUrl}`,
  });
};
