import { Router } from 'express';
import { authenticate, requireSuperAdmin, requireRole } from '../../middlewares/auth';
import { auditService } from './audit.service';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

const router = Router();

// Audit log azienda (solo ADMIN)
router.get('/company', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '50');
    const result = await auditService.getCompanyLogs(req.user!.companyId!, page, limit);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Audit log globale (solo Super Admin)
router.get('/global', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '50');
    const filters: any = {};
    if (req.query.companyId) filters.companyId = req.query.companyId;
    if (req.query.action) filters.action = req.query.action;
    const result = await auditService.getGlobalLogs(page, limit, filters);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

export default router;
