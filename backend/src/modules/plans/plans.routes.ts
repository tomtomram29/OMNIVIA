import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../../middlewares/auth';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';

const router = Router();

// Lista piani (pubblica - per pagina pricing)
router.get('/', async (_req, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
    res.json({ success: true, data: plans });
  } catch (error) { next(error); }
});

// Crea piano (solo Super Admin)
router.post('/', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.create({ data: req.body });
    res.status(201).json({ success: true, data: plan, message: 'Piano creato.' });
  } catch (error) { next(error); }
});

// Aggiorna piano (solo Super Admin)
router.patch('/:id', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: plan, message: 'Piano aggiornato.' });
  } catch (error) { next(error); }
});

// Elimina piano (solo Super Admin)
router.delete('/:id', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.plan.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Piano disattivato.' });
  } catch (error) { next(error); }
});

export default router;
