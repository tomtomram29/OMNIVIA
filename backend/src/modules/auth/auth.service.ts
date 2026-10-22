import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { config } from '../../config/env';
import { AppError } from '../../middlewares/errorHandler';
import { UserRole, SubscriptionStatus } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notifications/notifications.service';

// ============================================================
// JWT HELPERS
// ============================================================
const generateAccessToken = (
  userId: string,
  email: string,
  role: UserRole,
  companyId?: string
): string => {
  return jwt.sign(
    { userId, email, role, companyId },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions
  );
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
};

// ============================================================
// REGISTER
// ============================================================
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyEmail?: string;
  phone?: string;
}

export const authService = {
  async register(input: RegisterInput, ipAddress?: string) {
    const { email, password, firstName, lastName, companyName, companyEmail, phone } = input;

    // Controlla email esistente
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email già registrata.', 409);
    }

    // Cerca il piano base (o crea uno se non esiste)
    let plan = await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { priceMonthly: 'asc' } });
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: 'Starter',
          description: 'Piano base di OMNIVIA',
          priceMonthly: 29.00,
          priceYearly: 290.00,
          durationDays: 30,
          maxUsers: 5,
          isActive: true,
        },
      });
    }

    // Calcola trial
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + config.TRIAL_DURATION_DAYS);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Crea slug azienda
    const baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const existingCompany = await prisma.company.findUnique({ where: { slug: baseSlug } });
    const slug = existingCompany ? `${baseSlug}-${Date.now()}` : baseSlug;

    // Transazione: crea utente, azienda, company_user, subscription
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: UserRole.ADMIN, // Il primo utente è sempre ADMIN
          isActive: true,
          emailVerified: true,
        },
      });

      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          email: companyEmail || email,
          phone,
          status: 'TRIAL',
          invoicePrefix: 'FT',
          quotePrefix: 'PV',
        },
      });

      await tx.companyUser.create({
        data: {
          companyId: company.id,
          userId: user.id,
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      await tx.subscription.create({
        data: {
          companyId: company.id,
          planId: plan!.id,
          status: SubscriptionStatus.TRIAL,
          trialStart,
          trialEnd,
        },
      });

      return { user, company };
    });

    // Audit log
    await auditService.log({
      userId: result.user.id,
      companyId: result.company.id,
      action: 'CREATE',
      entity: 'Company',
      entityId: result.company.id,
      description: `Nuova registrazione: ${companyName}`,
      ipAddress,
    });

    // Genera token
    const accessToken = generateAccessToken(
      result.user.id,
      result.user.email,
      UserRole.ADMIN,
      result.company.id
    );
    const refreshToken = generateRefreshToken(result.user.id);

    await prisma.user.update({
      where: { id: result.user.id },
      data: { refreshToken },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: UserRole.ADMIN,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        status: result.company.status,
      },
      subscription: {
        status: SubscriptionStatus.TRIAL,
        trialStart,
        trialEnd,
        daysRemaining: config.TRIAL_DURATION_DAYS,
      },
      accessToken,
      refreshToken,
    };
  },

  // ============================================================
  // LOGIN
  // ============================================================
  async login(email: string, password: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: { company: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Credenziali non valide.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Credenziali non valide.', 401);
    }

    // Determina companyId e ruolo aziendale
    let companyId: string | undefined;
    let companyRole: UserRole = user.role;
    let companyData = null;
    let subscriptionData = null;

    if (user.role === UserRole.SUPER_ADMIN_OMNIVIA) {
      // Super admin: nessuna azienda
      companyId = undefined;
    } else if (user.companyUsers.length > 0) {
      const cu = user.companyUsers[0];
      companyId = cu.companyId;
      companyRole = cu.role;
      companyData = {
        id: cu.company.id,
        name: cu.company.name,
        status: cu.company.status,
      };

      subscriptionData = await prisma.subscription.findUnique({
        where: { companyId: cu.companyId },
        include: { plan: true },
      });
    }

    // Genera token
    const accessToken = generateAccessToken(user.id, user.email, companyRole, companyId);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLoginAt: new Date() },
    });

    // Audit log
    await auditService.log({
      userId: user.id,
      companyId,
      action: 'LOGIN',
      description: `Login: ${user.email}`,
      ipAddress,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: companyRole,
        isSuperAdmin: user.role === UserRole.SUPER_ADMIN_OMNIVIA,
      },
      company: companyData,
      subscription: subscriptionData
        ? {
            status: subscriptionData.status,
            trialStart: subscriptionData.trialStart,
            trialEnd: subscriptionData.trialEnd,
            startDate: subscriptionData.startDate,
            endDate: subscriptionData.endDate,
            plan: subscriptionData.plan ? { name: subscriptionData.plan.name } : null,
          }
        : null,
      accessToken,
      refreshToken,
    };
  },

  // ============================================================
  // REFRESH TOKEN
  // ============================================================
  async refresh(refreshToken: string) {
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      throw new AppError('Refresh token non valido o scaduto.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        companyUsers: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      throw new AppError('Refresh token non valido.', 401);
    }

    let companyId: string | undefined;
    let companyRole: UserRole = user.role;

    if (user.role !== UserRole.SUPER_ADMIN_OMNIVIA && user.companyUsers.length > 0) {
      companyId = user.companyUsers[0].companyId;
      companyRole = user.companyUsers[0].role;
    }

    const newAccessToken = generateAccessToken(user.id, user.email, companyRole, companyId);
    const newRefreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  // ============================================================
  // LOGOUT
  // ============================================================
  async logout(userId: string, companyId?: string, ipAddress?: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await auditService.log({
      userId,
      companyId,
      action: 'LOGOUT',
      description: 'Logout',
      ipAddress,
    });
  },

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Non rivelare se l'email esiste
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: expiresAt,
      },
    });

    // TODO: inviare email con link reset
    // emailService.sendPasswordReset(email, resetToken);

    return resetToken; // Solo in sviluppo
  },

  // ============================================================
  // RESET PASSWORD
  // ============================================================
  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError('Token di reset non valido o scaduto.', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        refreshToken: null, // Invalida sessioni esistenti
      },
    });

    await auditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET',
      description: 'Password reimpostata',
    });
  },

  // ============================================================
  // CHANGE PASSWORD (utente autenticato)
  // ============================================================
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Utente non trovato.', 404);

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError('Password attuale non corretta.', 400);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, refreshToken: null },
    });

    await auditService.log({
      userId,
      action: 'PASSWORD_CHANGE',
      description: 'Password modificata',
    });
  },

  // ============================================================
  // GET PROFILE
  // ============================================================
  async getProfile(userId: string, companyId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError('Utente non trovato.', 404);

    let companyData = null;
    let subscriptionData = null;

    if (companyId) {
      const companyUser = await prisma.companyUser.findUnique({
        where: { companyId_userId: { companyId, userId } },
        include: {
          company: {
            include: {
              subscription: {
                include: { plan: true },
              },
            },
          },
        },
      });

      if (companyUser) {
        companyData = {
          id: companyUser.company.id,
          name: companyUser.company.name,
          status: companyUser.company.status,
          role: companyUser.role,
        };

        if (companyUser.company.subscription) {
          const sub = companyUser.company.subscription;
          const now = new Date();
          let daysRemaining = 0;

          if (sub.status === 'TRIAL' && sub.trialEnd) {
            daysRemaining = Math.max(
              0,
              Math.ceil((sub.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            );
          } else if (sub.status === 'ACTIVE' && sub.endDate) {
            daysRemaining = Math.max(
              0,
              Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            );
          }

          subscriptionData = {
            status: sub.status,
            trialStart: sub.trialStart,
            trialEnd: sub.trialEnd,
            startDate: sub.startDate,
            endDate: sub.endDate,
            daysRemaining,
            plan: sub.plan ? { id: sub.plan.id, name: sub.plan.name } : null,
          };
        }
      }
    }

    return { user, company: companyData, subscription: subscriptionData };
  },
};
