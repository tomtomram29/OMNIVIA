import { Router } from 'express';
import { authenticate, requireSuperAdmin, requireCompany } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';

const router = Router();

// Subscription propria azienda
router.get('/my', authenticate, requireCompany, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { companyId: req.user!.companyId! },
      include: {
        plan: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription non trovata.' });
      return;
    }

    const now = new Date();
    let daysRemaining = 0;
    if (subscription.status === 'TRIAL' && subscription.trialEnd) {
      daysRemaining = Math.max(0, Math.ceil((subscription.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    } else if (subscription.status === 'ACTIVE' && subscription.endDate) {
      daysRemaining = Math.max(0, Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    res.json({ success: true, data: { ...subscription, daysRemaining } });
  } catch (error) { next(error); }
});

// Lista tutte le subscription (Super Admin)
router.get('/admin/list', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const skip = (page - 1) * limit;
    const where: any = {};
    if (req.query.status) where.status = req.query.status;

    const [subscriptions, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, email: true, status: true } },
          plan: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({ success: true, data: { subscriptions, total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

export default router;
