import { Router } from 'express';
import { authenticate, requireCompany, requireRole, requireSuperAdmin } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { auditService } from '../audit/audit.service';

const router = Router();

// ============================================================
// SUPPLIERS CRUD (company-scoped)
// ============================================================
router.use(authenticate, requireCompany, checkSubscription);

// Lista fornitori
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const skip = (page - 1) * limit;
    const where: any = { companyId: req.user!.companyId! };

    if (req.query.search) {
      where.OR = [
        { businessName: { contains: req.query.search as string, mode: 'insensitive' } },
        { contactName: { contains: req.query.search as string, mode: 'insensitive' } },
        { email: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

    const [suppliers, total] = await prisma.$transaction([
      prisma.supplier.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.supplier.count({ where }),
    ]);
    res.json({ success: true, data: { suppliers, total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// Dettaglio fornitore
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
      include: { documents: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!supplier) { res.status(404).json({ success: false, message: 'Fornitore non trovato.' }); return; }
    res.json({ success: true, data: supplier });
  } catch (error) { next(error); }
});

// Crea fornitore
router.post('/', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await prisma.supplier.create({
      data: { ...req.body, companyId: req.user!.companyId! },
    });
    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'CREATE',
      entity: 'Supplier',
      entityId: supplier.id,
      description: `Nuovo fornitore: ${supplier.businessName}`,
    });
    res.status(201).json({ success: true, data: supplier, message: 'Fornitore creato.' });
  } catch (error) { next(error); }
});

// Aggiorna fornitore
router.patch('/:id', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.supplier.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Fornitore non trovato.' }); return; }
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
    await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'UPDATE', entity: 'Supplier', entityId: supplier.id });
    res.json({ success: true, data: supplier, message: 'Fornitore aggiornato.' });
  } catch (error) { next(error); }
});

// Elimina fornitore (soft delete)
router.delete('/:id', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.supplier.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Fornitore non trovato.' }); return; }
    await prisma.supplier.update({ where: { id: req.params.id }, data: { isActive: false } });
    await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'DELETE', entity: 'Supplier', entityId: req.params.id });
    res.json({ success: true, message: 'Fornitore disattivato.' });
  } catch (error) { next(error); }
});

export default router;
