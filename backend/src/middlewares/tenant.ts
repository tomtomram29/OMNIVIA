import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { UserRole } from '@prisma/client';

// ============================================================
// TENANT ISOLATION MIDDLEWARE
// Verifica che il companyId nei params/body corrisponda all'utente
// ============================================================
export const tenantIsolation = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Super admin bypassa il controllo tenant
  if (req.user?.role === UserRole.SUPER_ADMIN_OMNIVIA) {
    next();
    return;
  }

  // Per tutte le route aziendali, il company_id viene dal token JWT
  // NON dal request body o params (sicurezza!)
  if (!req.user?.companyId) {
    res.status(403).json({
      success: false,
      message: "Nessuna azienda associata all'utente.",
    });
    return;
  }

  // Se viene passato un company_id nel body, verificare che corrisponda
  if (req.body?.companyId && req.body.companyId !== req.user.companyId) {
    res.status(403).json({
      success: false,
      message: "Accesso negato: company_id non valido.",
    });
    return;
  }

  // Forza il companyId dell'utente autenticato (protezione backend)
  req.body.companyId = req.user.companyId;

  next();
};

// Helper per creare query con company_id forzato (multi-tenancy)
export const getTenantWhere = (req: AuthenticatedRequest, extraWhere?: object) => {
  if (req.user?.role === UserRole.SUPER_ADMIN_OMNIVIA) {
    return extraWhere || {};
  }
  return {
    companyId: req.user!.companyId,
    ...extraWhere,
  };
};
