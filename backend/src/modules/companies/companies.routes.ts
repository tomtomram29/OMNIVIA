import { Router } from 'express';
import { authenticate, requireSuperAdmin, requireRole, requireCompany } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { companiesService } from './companies.service';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

const router = Router();

// ============================================================
// SUPER ADMIN ROUTES
// ============================================================

// Dashboard stats
router.get('/admin/stats', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await companiesService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
});

// Lista tutte le aziende
router.get('/admin/list', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.search) filters.search = req.query.search;
    const result = await companiesService.listAll(page, limit, filters);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Dettaglio azienda
router.get('/admin/:companyId', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const company = await companiesService.getById(req.params.companyId);
    res.json({ success: true, data: company });
  } catch (error) { next(error); }
});

// Sospendi
router.post('/admin/:companyId/suspend', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await companiesService.suspend(req.params.companyId, req.user!.id, req.body.reason);
    res.json({ success: true, message: 'Azienda sospesa con successo.' });
  } catch (error) { next(error); }
});

// Riattiva
router.post('/admin/:companyId/reactivate', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const endDate = req.body.endDate ? new Date(req.body.endDate) : undefined;
    await companiesService.reactivate(req.params.companyId, req.user!.id, endDate);
    res.json({ success: true, message: 'Azienda riattivata con successo.' });
  } catch (error) { next(error); }
});

// Estendi trial
router.post('/admin/:companyId/extend-trial', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { days } = req.body;
    if (!days || days < 1) {
      res.status(400).json({ success: false, message: 'Specificare il numero di giorni (minimo 1).' });
      return;
    }
    await companiesService.extendTrial(req.params.companyId, req.user!.id, parseInt(days));
    res.json({ success: true, message: `Trial esteso di ${days} giorni.` });
  } catch (error) { next(error); }
});

// Cambia piano
router.post('/admin/:companyId/change-plan', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      res.status(400).json({ success: false, message: 'planId obbligatorio.' });
      return;
    }
    await companiesService.changePlan(req.params.companyId, planId, req.user!.id);
    res.json({ success: true, message: 'Piano aggiornato con successo.' });
  } catch (error) { next(error); }
});

// Aggiorna scadenza
router.post('/admin/:companyId/update-end-date', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { endDate } = req.body;
    if (!endDate) {
      res.status(400).json({ success: false, message: 'endDate obbligatorio.' });
      return;
    }
    await companiesService.updateSubscriptionEndDate(req.params.companyId, new Date(endDate), req.user!.id);
    res.json({ success: true, message: 'Scadenza aggiornata.' });
  } catch (error) { next(error); }
});

// Aggiorna note interne
router.patch('/admin/:companyId/notes', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await companiesService.updateInternalNotes(req.params.companyId, req.body.notes || '', req.user!.id);
    res.json({ success: true, message: 'Note aggiornate.' });
  } catch (error) { next(error); }
});

// ============================================================
// COMPANY SELF-MANAGEMENT ROUTES
// ============================================================

// Info propria azienda
router.get('/my', authenticate, requireCompany, checkSubscription, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const company = await companiesService.getCompanyInfo(req.user!.companyId!);
    res.json({ success: true, data: company });
  } catch (error) { next(error); }
});

// Aggiorna impostazioni propria azienda (solo ADMIN)
router.patch('/my', authenticate, requireCompany, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const company = await companiesService.updateCompanySettings(req.user!.companyId!, req.body);
    res.json({ success: true, message: 'Impostazioni azienda aggiornate.', data: company });
  } catch (error) { next(error); }
});

export default router;
