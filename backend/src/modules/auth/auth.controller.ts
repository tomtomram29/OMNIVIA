import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
  firstName: z.string().min(1, 'Nome obbligatorio'),
  lastName: z.string().min(1, 'Cognome obbligatorio'),
  companyName: z.string().min(2, 'Nome azienda obbligatorio (min. 2 caratteri)'),
  companyEmail: z.string().email().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.register(input, ipAddress);

      res.status(201).json({
        success: true,
        message: `Registrazione completata! Hai ${process.env.TRIAL_DURATION_DAYS || 14} giorni di prova gratuita.`,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: error.errors[0].message });
        return;
      }
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.login(email, password, ipAddress);

      res.json({
        success: true,
        message: 'Login effettuato con successo.',
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Credenziali non valide.' });
        return;
      }
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(401).json({ success: false, message: 'Refresh token mancante.' });
        return;
      }
      const result = await authService.refresh(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      await authService.logout(req.user!.id, req.user?.companyId, ipAddress);
      res.json({ success: true, message: 'Logout effettuato con successo.' });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const token = await authService.forgotPassword(email);
      
      // In produzione non restituire il token
      const response: any = { success: true, message: 'Se l\'email esiste, riceverai un link per il reset.' };
      if (process.env.NODE_ENV === 'development' && token) {
        response.debug_token = token;
      }
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(token, newPassword);
      res.json({ success: true, message: 'Password reimpostata con successo.' });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user!.id, currentPassword, newPassword);
      res.json({ success: true, message: 'Password modificata con successo. Effettua nuovamente il login.' });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.getProfile(req.user!.id, req.user?.companyId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
