import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../config/database';
import { SubscriptionStatus, UserRole } from '@prisma/client';

// ============================================================
// SUBSCRIPTION CHECK MIDDLEWARE
// Blocca l'accesso se la subscription è EXPIRED/SUSPENDED/CANCELLED
// ============================================================
export const checkSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Super admin bypassa il controllo subscription
  if (req.user?.role === UserRole.SUPER_ADMIN_OMNIVIA) {
    next();
    return;
  }

  if (!req.user?.companyId) {
    next();
    return;
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { companyId: req.user.companyId },
      select: {
        status: true,
        trialEnd: true,
        endDate: true,
        company: { select: { status: true } },
      },
    });

    if (!subscription) {
      res.status(403).json({
        success: false,
        message: "Nessuna subscription trovata per questa azienda.",
        code: 'NO_SUBSCRIPTION',
      });
      return;
    }

    const companyStatus = subscription.company.status;

    // Controlla lo stato dell'azienda
    if (companyStatus === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: "Il tuo account è stato sospeso. Contatta il supporto.",
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    if (companyStatus === 'CANCELLED') {
      res.status(403).json({
        success: false,
        message: "Il tuo account è stato cancellato.",
        code: 'ACCOUNT_CANCELLED',
      });
      return;
    }

    // Controlla la scadenza del trial
    if (subscription.status === SubscriptionStatus.TRIAL && subscription.trialEnd) {
      const now = new Date();
      if (now > subscription.trialEnd) {
        // Aggiorna automaticamente lo stato
        await prisma.$transaction([
          prisma.subscription.update({
            where: { companyId: req.user.companyId },
            data: { status: SubscriptionStatus.EXPIRED },
          }),
          prisma.company.update({
            where: { id: req.user.companyId },
            data: { status: 'EXPIRED' },
          }),
        ]);

        res.status(403).json({
          success: false,
          message: "Il periodo di prova è scaduto. Attiva un abbonamento per continuare.",
          code: 'TRIAL_EXPIRED',
        });
        return;
      }
    }

    // Controlla la scadenza dell'abbonamento
    if (subscription.status === SubscriptionStatus.ACTIVE && subscription.endDate) {
      const now = new Date();
      if (now > subscription.endDate) {
        await prisma.$transaction([
          prisma.subscription.update({
            where: { companyId: req.user.companyId },
            data: { status: SubscriptionStatus.EXPIRED },
          }),
          prisma.company.update({
            where: { id: req.user.companyId },
            data: { status: 'EXPIRED' },
          }),
        ]);

        res.status(403).json({
          success: false,
          message: "Il tuo abbonamento è scaduto. Rinnova per continuare.",
          code: 'SUBSCRIPTION_EXPIRED',
        });
        return;
      }
    }

    if (
      subscription.status === SubscriptionStatus.EXPIRED ||
      companyStatus === 'EXPIRED'
    ) {
      res.status(403).json({
        success: false,
        message: "Il tuo abbonamento è scaduto. Rinnova per continuare.",
        code: 'SUBSCRIPTION_EXPIRED',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
