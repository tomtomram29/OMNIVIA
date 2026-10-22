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

// Lista prodotti
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
    if (req.query.category) where.category = req.query.category;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      prisma.product.count({ where }),
    ]);
    res.json({ success: true, data: { products, total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// Dettaglio prodotto
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
    });
    if (!product) { res.status(404).json({ success: false, message: 'Prodotto non trovato.' }); return; }
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
});

// Crea prodotto
router.post('/', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.create({
      data: { ...req.body, companyId: req.user!.companyId! },
    });
    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      description: `Nuovo prodotto: ${product.name}`,
    });
    res.status(201).json({ success: true, data: product, message: 'Prodotto creato.' });
  } catch (error) { next(error); }
});

// Aggiorna prodotto
router.patch('/:id', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Prodotto non trovato.' }); return; }
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'UPDATE', entity: 'Product', entityId: product.id });
    res.json({ success: true, data: product, message: 'Prodotto aggiornato.' });
  } catch (error) { next(error); }
});

// Elimina prodotto
router.delete('/:id', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Prodotto non trovato.' }); return; }
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'DELETE', entity: 'Product', entityId: req.params.id });
    res.json({ success: true, message: 'Prodotto disattivato.' });
  } catch (error) { next(error); }
});

export default router;
