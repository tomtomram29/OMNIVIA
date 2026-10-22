import { Router } from 'express';
import { authenticate, requireCompany } from '../../middlewares/auth';
import { notificationService } from './notifications.service';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';

const router = Router();

router.use(authenticate, requireCompany);

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const result = await notificationService.getUserNotifications(
      req.user!.id,
      req.user!.companyId!,
      unreadOnly
    );
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Notifica segnata come letta.' });
  } catch (error) { next(error); }
});

router.post('/mark-all-read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.user!.id, req.user!.companyId!);
    res.json({ success: true, message: 'Tutte le notifiche segnate come lette.' });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Notifica eliminata.' });
  } catch (error) { next(error); }
});

export default router;
