import { Router } from 'express';
import { authenticate, requireCompany, requireRole } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { auditService } from '../audit/audit.service';

const router = Router();
router.use(authenticate, requireCompany, checkSubscription);

// Lista servizi
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '50');
    const skip = (page - 1) * limit;
    const where: any = { companyId: req.user!.companyId! };

    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search as string, mode: 'insensitive' } },
        { code: { contains: req.query.search as string, mode: 'insensitive' } },
        { description: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

    const [services, total] = await prisma.$transaction([
      prisma.service.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      prisma.service.count({ where }),
    ]);
    res.json({ success: true, data: { services, total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// Dettaglio servizio
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const service = await prisma.service.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
    });
    if (!service) { res.status(404).json({ success: false, message: 'Servizio non trovato.' }); return; }
    res.json({ success: true, data: service });
  } catch (error) { next(error); }
});

// Crea servizio
router.post('/', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const service = await prisma.service.create({
      data: { ...req.body, companyId: req.user!.companyId! },
    });
    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'CREATE',
      entity: 'Service',
      entityId: service.id,
      description: `Nuovo servizio: ${service.name}`,
    });
    res.status(201).json({ success: true, data: service, message: 'Servizio creato.' });
  } catch (error) { next(error); }
});

// Aggiorna servizio
router.patch('/:id', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.service.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Servizio non trovato.' }); return; }
    const service = await prisma.service.update({ where: { id: req.params.id }, data: req.body });
    await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'UPDATE', entity: 'Service', entityId: service.id });
    res.json({ success: true, data: service, message: 'Servizio aggiornato.' });
  } catch (error) { next(error); }
});

// Elimina servizio
router.delete('/:id', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.service.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Servizio non trovato.' }); return; }
    await prisma.service.update({ where: { id: req.params.id }, data: { isActive: false } });
    await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'DELETE', entity: 'Service', entityId: req.params.id });
    res.json({ success: true, message: 'Servizio disattivato.' });
  } catch (error) { next(error); }
});

export default router;
