import { Router } from 'express';
import { authenticate, requireCompany, requireRole } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { UserRole, TaskStatus } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notifications/notifications.service';

const router = Router();
router.use(authenticate, requireCompany, checkSubscription);

// ============================================================
// Lista attività
// ============================================================
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const skip = (page - 1) * limit;
    const where: any = { companyId: req.user!.companyId! };

    // Employee vede solo le proprie attività
    if (req.user!.companyRole === UserRole.EMPLOYEE) {
      where.OR = [
        { assigneeId: req.user!.id },
        { creatorId: req.user!.id },
      ];
    }

    if (req.query.search) {
      const searchCondition = {
        OR: [
          { title: { contains: req.query.search as string, mode: 'insensitive' as const } },
          { description: { contains: req.query.search as string, mode: 'insensitive' as const } },
        ],
      };
      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition];
        delete where.OR;
      } else {
        Object.assign(where, searchCondition);
      }
    }
    if (req.query.status) where.status = req.query.status;
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.assigneeId) where.assigneeId = req.query.assigneeId;
    if (req.query.clientId) where.clientId = req.query.clientId;

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
          client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({ success: true, data: { tasks, total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// ============================================================
// Statistiche attività (per dashboard)
// ============================================================
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const now = new Date();

    const [todo, inProgress, completed, overdue] = await prisma.$transaction([
      prisma.task.count({ where: { companyId, status: 'TODO' } }),
      prisma.task.count({ where: { companyId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { companyId, status: 'COMPLETED' } }),
      prisma.task.count({ where: { companyId, status: 'OVERDUE' } }),
    ]);

    // Aggiorna automaticamente le attività scadute
    await prisma.task.updateMany({
      where: {
        companyId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });

    res.json({
      success: true,
      data: { todo, inProgress, completed, overdue, total: todo + inProgress + completed + overdue },
    });
  } catch (error) { next(error); }
});

// ============================================================
// Dettaglio attività
// ============================================================
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!task) { res.status(404).json({ success: false, message: 'Attività non trovata.' }); return; }
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
});

// ============================================================
// Crea attività
// ============================================================
router.post('/', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, status, priority, assigneeId, clientId, dueDate, notes } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Il titolo è obbligatorio.' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        companyId: req.user!.companyId!,
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        assigneeId,
        creatorId: req.user!.id,
        clientId,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
      },
    });

    // Notifica all'assegnatario
    if (assigneeId && assigneeId !== req.user!.id) {
      await notificationService.create({
        companyId: req.user!.companyId!,
        userId: assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Nuova attività assegnata',
        message: `Ti è stata assegnata l'attività: ${title}`,
        data: { taskId: task.id },
      });
    }

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'CREATE',
      entity: 'Task',
      entityId: task.id,
      description: `Nuova attività: ${title}`,
    });

    res.status(201).json({ success: true, data: task, message: 'Attività creata.' });
  } catch (error) { next(error); }
});

// ============================================================
// Aggiorna attività
// ============================================================
router.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
    });
    if (!existing) { res.status(404).json({ success: false, message: 'Attività non trovata.' }); return; }

    // Employee può aggiornare solo le proprie attività (solo stato e note)
    if (req.user!.companyRole === UserRole.EMPLOYEE) {
      if (existing.assigneeId !== req.user!.id && existing.creatorId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Non hai i permessi per questa attività.' });
        return;
      }
      // Employee può cambiare solo status e notes
      const { status, notes } = req.body;
      const updateData: any = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (status === 'COMPLETED') updateData.completedAt = new Date();

      const task = await prisma.task.update({ where: { id: req.params.id }, data: updateData });
      res.json({ success: true, data: task, message: 'Attività aggiornata.' });
      return;
    }

    const updateData: any = { ...req.body };
    if (req.body.dueDate) updateData.dueDate = new Date(req.body.dueDate);
    if (req.body.status === 'COMPLETED') updateData.completedAt = new Date();
    delete updateData.companyId;
    delete updateData.creatorId;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
      },
    });

    // Notifica se assegnatario cambia
    if (req.body.assigneeId && req.body.assigneeId !== existing.assigneeId && req.body.assigneeId !== req.user!.id) {
      await notificationService.create({
        companyId: req.user!.companyId!,
        userId: req.body.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Attività assegnata',
        message: `Ti è stata assegnata l'attività: ${task.title}`,
        data: { taskId: task.id },
      });
    }

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'UPDATE',
      entity: 'Task',
      entityId: task.id,
    });

    res.json({ success: true, data: task, message: 'Attività aggiornata.' });
  } catch (error) { next(error); }
});

// ============================================================
// Elimina attività
// ============================================================
router.delete('/:id', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Attività non trovata.' }); return; }

    await prisma.task.delete({ where: { id: req.params.id } });
    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'DELETE',
      entity: 'Task',
      entityId: req.params.id,
      description: `Attività eliminata: ${existing.title}`,
    });

    res.json({ success: true, message: 'Attività eliminata.' });
  } catch (error) { next(error); }
});

export default router;
