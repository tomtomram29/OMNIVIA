import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    companyId?: string;
    companyRole?: UserRole;
  };
}

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// AUTHENTICATE — Verifica JWT e carica utente
// ============================================================
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Token di autenticazione mancante.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
    } catch {
      res.status(401).json({ success: false, message: 'Token non valido o scaduto.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Utente non trovato o disattivato.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: decoded.companyId,
      companyRole: decoded.companyId ? decoded.role : undefined,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// ============================================================
// REQUIRE SUPER ADMIN — Solo SUPER_ADMIN_OMNIVIA
// ============================================================
export const requireSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== UserRole.SUPER_ADMIN_OMNIVIA) {
    res.status(403).json({ success: false, message: 'Accesso riservato al Super Admin.' });
    return;
  }
  next();
};

// ============================================================
// REQUIRE ROLE — Controlla ruolo aziendale
// ============================================================
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Super admin bypasses role checks
    if (req.user?.role === UserRole.SUPER_ADMIN_OMNIVIA) {
      next();
      return;
    }

    const userRole = req.user?.companyRole || req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Non hai i permessi necessari per questa operazione.',
      });
      return;
    }
    next();
  };
};

// ============================================================
// REQUIRE COMPANY — Assicura che l'utente abbia un company_id
// ============================================================
export const requireCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Super admin non ha un'azienda propria
  if (req.user?.role === UserRole.SUPER_ADMIN_OMNIVIA) {
    next();
    return;
  }

  if (!req.user?.companyId) {
    res.status(403).json({
      success: false,
      message: "Nessuna azienda associata all'utente.",
    });
    return;
  }
  next();
};
