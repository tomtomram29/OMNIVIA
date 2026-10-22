import { Router } from 'express';
import { authenticate, requireCompany } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notifications/notifications.service';

const router = Router();
router.use(authenticate, requireCompany, checkSubscription);

// ============================================================
// Lista eventi per range di date
// ============================================================
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const where: any = { companyId: req.user!.companyId! };

    // Filtra per range di date
    if (req.query.start && req.query.end) {
      where.startDate = { gte: new Date(req.query.start as string) };
      where.endDate = { lte: new Date(req.query.end as string) };
    } else if (req.query.start) {
      where.startDate = { gte: new Date(req.query.start as string) };
    } else if (req.query.month && req.query.year) {
      const month = parseInt(req.query.month as string);
      const year = parseInt(req.query.year as string);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      where.OR = [
        { startDate: { gte: startOfMonth, lte: endOfMonth } },
        { endDate: { gte: startOfMonth, lte: endOfMonth } },
        { AND: [{ startDate: { lte: startOfMonth } }, { endDate: { gte: endOfMonth } }] },
      ];
    }

    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.clientId) where.clientId = req.query.clientId;

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    res.json({ success: true, data: events });
  } catch (error) { next(error); }
});

// ============================================================
// Dettaglio evento
// ============================================================
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
      },
    });
    if (!event) { res.status(404).json({ success: false, message: 'Evento non trovato.' }); return; }
    res.json({ success: true, data: event });
  } catch (error) { next(error); }
});

// ============================================================
// Crea evento
// ============================================================
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, startDate, endDate, allDay, location, color, clientId, notes, userId } = req.body;

    if (!title || !startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Titolo, data inizio e data fine sono obbligatori.' });
      return;
    }

    const event = await prisma.calendarEvent.create({
      data: {
        companyId: req.user!.companyId!,
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay: allDay || false,
        location,
        color: color || '#3B82F6',
        userId: userId || req.user!.id,
        clientId,
        notes,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
      },
    });

    // Notifica se l'evento è assegnato a un altro utente
    const targetUserId = userId || req.user!.id;
    if (targetUserId !== req.user!.id) {
      await notificationService.create({
        companyId: req.user!.companyId!,
        userId: targetUserId,
        type: 'APPOINTMENT_CREATED',
        title: 'Nuovo appuntamento',
        message: `È stato creato un appuntamento: ${title}`,
        data: { calendarEventId: event.id },
      });
    }

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'CREATE',
      entity: 'CalendarEvent',
      entityId: event.id,
      description: `Nuovo evento: ${title}`,
    });

    res.status(201).json({ success: true, data: event, message: 'Evento creato.' });
  } catch (error) { next(error); }
});

// ============================================================
// Aggiorna evento
// ============================================================
router.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
    });
    if (!existing) { res.status(404).json({ success: false, message: 'Evento non trovato.' }); return; }

    const updateData: any = { ...req.body };
    if (req.body.startDate) updateData.startDate = new Date(req.body.startDate);
    if (req.body.endDate) updateData.endDate = new Date(req.body.endDate);
    delete updateData.companyId;

    const event = await prisma.calendarEvent.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
      },
    });

    // Notifica modifica
    if (event.userId !== req.user!.id) {
      await notificationService.create({
        companyId: req.user!.companyId!,
        userId: event.userId,
        type: 'APPOINTMENT_CHANGED',
        title: 'Appuntamento modificato',
        message: `L'appuntamento "${event.title}" è stato modificato.`,
        data: { calendarEventId: event.id },
      });
    }

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'UPDATE',
      entity: 'CalendarEvent',
      entityId: event.id,
    });

    res.json({ success: true, data: event, message: 'Evento aggiornato.' });
  } catch (error) { next(error); }
});

// ============================================================
// Elimina evento
// ============================================================
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
    });
    if (!existing) { res.status(404).json({ success: false, message: 'Evento non trovato.' }); return; }

    await prisma.calendarEvent.delete({ where: { id: req.params.id } });

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'DELETE',
      entity: 'CalendarEvent',
      entityId: req.params.id,
      description: `Evento eliminato: ${existing.title}`,
    });

    res.json({ success: true, message: 'Evento eliminato.' });
  } catch (error) { next(error); }
});

export default router;
