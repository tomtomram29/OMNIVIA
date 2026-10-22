import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { auditService } from '../audit/audit.service';
import { CompanyStatus, SubscriptionStatus } from '@prisma/client';

export const companiesService = {
  // ============================================================
  // SUPER ADMIN — Lista tutte le aziende
  // ============================================================
  async listAll(page = 1, limit = 20, filters?: { status?: CompanyStatus; search?: string }) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await prisma.$transaction([
      prisma.company.findMany({
        where,
        include: {
          subscription: { include: { plan: true } },
          _count: { select: { companyUsers: true, clients: true, invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return { companies, total, page, limit, pages: Math.ceil(total / limit) };
  },

  // ============================================================
  // SUPER ADMIN — Dettaglio azienda
  // ============================================================
  async getById(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: { include: { plan: true, payments: { orderBy: { createdAt: 'desc' }, take: 10 } } },
        companyUsers: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, lastLoginAt: true, isActive: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: {
            clients: true,
            suppliers: true,
            products: true,
            services: true,
            tasks: true,
            quotes: true,
            invoices: true,
            documents: true,
          },
        },
      },
    });

    if (!company) throw new AppError('Azienda non trovata.', 404);
    return company;
  },

  // ============================================================
  // SUPER ADMIN — Statistiche dashboard
  // ============================================================
  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCompanies,
      trialCompanies,
      activeCompanies,
      expiredCompanies,
      suspendedCompanies,
      cancelledCompanies,
      newCompaniesLast30Days,
      totalUsers,
      subscriptionsExpiringSoon,
    ] = await prisma.$transaction([
      prisma.company.count(),
      prisma.company.count({ where: { status: 'TRIAL' } }),
      prisma.company.count({ where: { status: 'ACTIVE' } }),
      prisma.company.count({ where: { status: 'EXPIRED' } }),
      prisma.company.count({ where: { status: 'SUSPENDED' } }),
      prisma.company.count({ where: { status: 'CANCELLED' } }),
      prisma.company.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { role: { not: 'SUPER_ADMIN_OMNIVIA' } } }),
      prisma.subscription.count({
        where: {
          OR: [
            { status: 'TRIAL', trialEnd: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), gte: now } },
            { status: 'ACTIVE', endDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), gte: now } },
          ],
        },
      }),
    ]);

    // Crescita aziende negli ultimi 6 mesi
    const growthData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = await prisma.company.count({
        where: { createdAt: { gte: monthStart, lte: monthEnd } },
      });
      growthData.push({
        month: monthStart.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
        count,
      });
    }

    return {
      companies: {
        total: totalCompanies,
        trial: trialCompanies,
        active: activeCompanies,
        expired: expiredCompanies,
        suspended: suspendedCompanies,
        cancelled: cancelledCompanies,
        newLast30Days: newCompaniesLast30Days,
      },
      users: { total: totalUsers },
      subscriptions: { expiringSoon: subscriptionsExpiringSoon },
      growthData,
    };
  },

  // ============================================================
  // SUPER ADMIN — Sospendi azienda
  // ============================================================
  async suspend(companyId: string, adminUserId: string, reason?: string) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Azienda non trovata.', 404);
    if (company.status === 'SUSPENDED') throw new AppError('Azienda già sospesa.', 400);

    await prisma.$transaction([
      prisma.company.update({ where: { id: companyId }, data: { status: 'SUSPENDED' } }),
      prisma.subscription.updateMany({
        where: { companyId },
        data: { status: SubscriptionStatus.SUSPENDED },
      }),
    ]);

    await auditService.log({
      userId: adminUserId,
      companyId,
      action: 'SUSPEND',
      entity: 'Company',
      entityId: companyId,
      oldData: { status: company.status },
      newData: { status: 'SUSPENDED' },
      description: reason || 'Azienda sospesa dal Super Admin',
    });
  },

  // ============================================================
  // SUPER ADMIN — Riattiva azienda
  // ============================================================
  async reactivate(companyId: string, adminUserId: string, endDate?: Date) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: true },
    });
    if (!company) throw new AppError('Azienda non trovata.', 404);

    const oldStatus = company.status;
    const now = new Date();
    const newEndDate = endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.company.update({ where: { id: companyId }, data: { status: 'ACTIVE' } }),
      prisma.subscription.updateMany({
        where: { companyId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          endDate: newEndDate,
        },
      }),
    ]);

    await auditService.log({
      userId: adminUserId,
      companyId,
      action: 'REACTIVATE',
      entity: 'Company',
      entityId: companyId,
      oldData: { status: oldStatus },
      newData: { status: 'ACTIVE', endDate: newEndDate },
      description: 'Azienda riattivata dal Super Admin',
    });
  },

  // ============================================================
  // SUPER ADMIN — Estendi trial
  // ============================================================
  async extendTrial(companyId: string, adminUserId: string, additionalDays: number) {
    const subscription = await prisma.subscription.findUnique({ where: { companyId } });
    if (!subscription) throw new AppError('Subscription non trovata.', 404);

    const currentTrialEnd = subscription.trialEnd || new Date();
    const newTrialEnd = new Date(Math.max(currentTrialEnd.getTime(), Date.now()));
    newTrialEnd.setDate(newTrialEnd.getDate() + additionalDays);

    await prisma.$transaction([
      prisma.subscription.update({
        where: { companyId },
        data: { status: SubscriptionStatus.TRIAL, trialEnd: newTrialEnd },
      }),
      prisma.company.update({ where: { id: companyId }, data: { status: 'TRIAL' } }),
    ]);

    await auditService.log({
      userId: adminUserId,
      companyId,
      action: 'EXTEND_TRIAL',
      entity: 'Subscription',
      entityId: subscription.id,
      newData: { newTrialEnd, additionalDays },
      description: `Trial esteso di ${additionalDays} giorni`,
    });
  },

  // ============================================================
  // SUPER ADMIN — Cambia piano
  // ============================================================
  async changePlan(companyId: string, planId: string, adminUserId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new AppError('Piano non trovato.', 404);

    const subscription = await prisma.subscription.findUnique({ where: { companyId } });
    const oldPlanId = subscription?.planId;

    await prisma.subscription.update({
      where: { companyId },
      data: { planId },
    });

    await auditService.log({
      userId: adminUserId,
      companyId,
      action: 'PLAN_CHANGE',
      entity: 'Subscription',
      oldData: { planId: oldPlanId },
      newData: { planId, planName: plan.name },
      description: `Piano cambiato in: ${plan.name}`,
    });
  },

  // ============================================================
  // SUPER ADMIN — Modifica scadenza subscription
  // ============================================================
  async updateSubscriptionEndDate(companyId: string, endDate: Date, adminUserId: string) {
    await prisma.subscription.update({
      where: { companyId },
      data: { endDate, status: SubscriptionStatus.ACTIVE },
    });
    await prisma.company.update({ where: { id: companyId }, data: { status: 'ACTIVE' } });

    await auditService.log({
      userId: adminUserId,
      companyId,
      action: 'SUBSCRIPTION_CHANGE',
      description: `Scadenza aggiornata: ${endDate.toLocaleDateString('it-IT')}`,
    });
  },

  // ============================================================
  // SUPER ADMIN — Aggiorna note interne
  // ============================================================
  async updateInternalNotes(companyId: string, notes: string, adminUserId: string) {
    await prisma.company.update({ where: { id: companyId }, data: { internalNotes: notes } });
  },

  // ============================================================
  // AZIENDA — Aggiorna impostazioni propria azienda
  // ============================================================
  async updateCompanySettings(companyId: string, data: any) {
    const allowed = [
      'name', 'email', 'phone', 'website', 'address', 'city', 'province',
      'postalCode', 'country', 'vatNumber', 'fiscalCode', 'invoicePrefix',
      'quotePrefix', 'defaultVatRate', 'currency',
    ];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    return prisma.company.update({ where: { id: companyId }, data: updateData });
  },

  // ============================================================
  // AZIENDA — Info propria azienda
  // ============================================================
  async getCompanyInfo(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: { include: { plan: true } },
        _count: {
          select: {
            clients: true,
            suppliers: true,
            products: true,
            services: true,
            tasks: true,
            quotes: true,
            invoices: true,
            documents: true,
          },
        },
      },
    });
    if (!company) throw new AppError('Azienda non trovata.', 404);
    return company;
  },
};
