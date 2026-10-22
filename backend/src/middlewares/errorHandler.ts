import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma errors
  const prismaError = err as any;
  if (prismaError.code) {
    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          message: 'Dati duplicati. Un record con questi valori esiste già.',
          field: prismaError.meta?.target,
        });
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          message: 'Record non trovato.',
        });
        return;
      case 'P2003':
        res.status(400).json({
          success: false,
          message: 'Riferimento a record non esistente.',
        });
        return;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Token non valido.' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token scaduto.' });
    return;
  }

  // Generic error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Errore interno del server.'
        : err.message,
  });
};
