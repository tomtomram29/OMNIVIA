import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, requireCompany, requireRole } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { auditService } from '../audit/audit.service';

const router = Router();

router.use(authenticate, requireCompany, checkSubscription);

// Lista utenti azienda (ADMIN only)
router.get('/', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.companyUser.findMany({
      where: { companyId: req.user!.companyId! },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true, lastLoginAt: true, createdAt: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (error) { next(error); }
});

// Crea nuovo utente (ADMIN only)
router.post('/', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, password, role } = req.body;

    // Verifica che non si possa creare SUPER_ADMIN
    if (role === UserRole.SUPER_ADMIN_OMNIVIA) {
      res.status(403).json({ success: false, message: 'Non puoi creare un Super Admin.' });
      return;
    }

    if (!email || !firstName || !lastName || !password) {
      res.status(400).json({ success: false, message: 'Tutti i campi sono obbligatori.' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Utente esiste, aggiungi ad azienda se non già presente
      const existing = await prisma.companyUser.findUnique({
        where: { companyId_userId: { companyId: req.user!.companyId!, userId: user.id } },
      });
      if (existing) {
        res.status(409).json({ success: false, message: 'Utente già presente in questa azienda.' });
        return;
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      user = await prisma.user.create({
        data: { email, firstName, lastName, passwordHash, role: role || UserRole.EMPLOYEE, isActive: true, emailVerified: true },
      });
    }

    const companyUser = await prisma.companyUser.create({
      data: { companyId: req.user!.companyId!, userId: user.id, role: role || UserRole.EMPLOYEE },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'INVITE_USER',
      entity: 'User',
      entityId: user.id,
      description: `Nuovo utente: ${email}`,
    });

    res.status(201).json({ success: true, data: companyUser, message: 'Utente creato con successo.' });
  } catch (error) { next(error); }
});

// Aggiorna ruolo utente (ADMIN only)
router.patch('/:userId/role', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;

    // Sicurezza: non permettere di assegnare SUPER_ADMIN
    if (role === UserRole.SUPER_ADMIN_OMNIVIA) {
      res.status(403).json({ success: false, message: 'Non puoi assegnare il ruolo Super Admin.' });
      return;
    }

    const cu = await prisma.companyUser.findUnique({
      where: { companyId_userId: { companyId: req.user!.companyId!, userId: req.params.userId } },
    });
    if (!cu) {
      res.status(404).json({ success: false, message: 'Utente non trovato.' });
      return;
    }

    const updated = await prisma.companyUser.update({
      where: { companyId_userId: { companyId: req.user!.companyId!, userId: req.params.userId } },
      data: { role },
    });

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'ROLE_CHANGE',
      entity: 'CompanyUser',
      entityId: req.params.userId,
      oldData: { role: cu.role },
      newData: { role },
    });

    res.json({ success: true, data: updated, message: 'Ruolo aggiornato.' });
  } catch (error) { next(error); }
});

// Disattiva utente (ADMIN only)
router.patch('/:userId/toggle-active', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Non permettere di disattivarsi da soli
    if (req.params.userId === req.user!.id) {
      res.status(400).json({ success: false, message: 'Non puoi disattivare il tuo stesso account.' });
      return;
    }

    const cu = await prisma.companyUser.findUnique({
      where: { companyId_userId: { companyId: req.user!.companyId!, userId: req.params.userId } },
    });
    if (!cu) {
      res.status(404).json({ success: false, message: 'Utente non trovato.' });
      return;
    }

    const updated = await prisma.companyUser.update({
      where: { companyId_userId: { companyId: req.user!.companyId!, userId: req.params.userId } },
      data: { isActive: !cu.isActive },
    });

    res.json({ success: true, data: updated, message: `Utente ${updated.isActive ? 'attivato' : 'disattivato'}.` });
  } catch (error) { next(error); }
});

export default router;
