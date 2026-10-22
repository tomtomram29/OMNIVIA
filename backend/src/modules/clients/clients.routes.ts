import { Router } from 'express';
import { authenticate, requireCompany, requireRole } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { tenantIsolation } from '../../middlewares/tenant';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { auditService } from '../audit/audit.service';

const router = Router();
router.use(authenticate, requireCompany, checkSubscription);

// Lista clienti
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const skip = (page - 1) * limit;
    const where: any = { companyId: req.user!.companyId! };
    if (req.query.search) {
      where.OR = [
        { firstName: { contains: req.query.search as string, mode: 'insensitive' } },
        { lastName: { contains: req.query.search as string, mode: 'insensitive' } },
        { businessName: { contains: req.query.search as string, mode: 'insensitive' } },
        { email: { contains: req.query.search as string, mode: 'insensitive' } },
        { phone: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

    const [clients, total] = await prisma.$transaction([
      prisma.client.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.client.count({ where }),
    ]);
    res.json({ success: true, data: { clients, total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// Dettaglio cliente con storico
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
      include: {
        tasks: { orderBy: { createdAt: 'desc' }, take: 10 },
        quotes: { orderBy: { createdAt: 'desc' }, take: 10 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        documents: { orderBy: { createdAt: 'desc' }, take: 10 },
        calendarEvents: { orderBy: { startDate: 'desc' }, take: 5 },
      },
    });
    if (!client) { res.status(404).json({ success: false, message: 'Cliente non trovato.' }); return; }
    res.json({ success: true, data: client });
  } catch (error) { next(error); }
});

// Crea cliente
router.post('/', requireRole(UserRole.ADMIN, UserRole.MANAGER), tenantIsolation, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.create({ data: { ...req.body, companyId: req.user!.companyId! } });
    await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'CREATE', entity: 'Client', entityId: client.id, description: `Nuovo cliente: ${client.firstName || ''} ${client.lastName || client.businessName || ''}` });
    res.status(201).json({ success: true, data: client, message: 'Cliente creato.' });
  } catch (error) { next(error); }
});

// Aggiorna cliente
router.patch('/:id', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Cliente non trovato.' }); return; }
    const client = await prisma.client.update({ where: { id: req.params.id }, data: req.body });
    await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'UPDATE', entity: 'Client', entityId: client.id });
    res.json({ success: true, data: client, message: 'Cliente aggiornato.' });
  } catch (error) { next(error); }
});

// Elimina cliente
router.delete('/:id', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Cliente non trovato.' }); return; }
    await prisma.client.update({ where: { id: req.params.id }, data: { isActive: false } });
    await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'DELETE', entity: 'Client', entityId: req.params.id });
    res.json({ success: true, message: 'Cliente disattivato.' });
  } catch (error) { next(error); }
});

export default router;
