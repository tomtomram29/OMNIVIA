import { prisma } from '../../config/database';
import { NotificationType } from '@prisma/client';

interface CreateNotificationInput {
  companyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: object;
}

export const notificationService = {
  async create(input: CreateNotificationInput) {
    try {
      return await prisma.notification.create({ data: input });
    } catch {
      console.error('Notification creation error:', input);
    }
  },

  async createForAllCompanyUsers(
    companyId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: object
  ) {
    try {
      const companyUsers = await prisma.companyUser.findMany({
        where: { companyId, isActive: true },
        select: { userId: true },
      });

      const notifications = companyUsers.map((cu) => ({
        companyId,
        userId: cu.userId,
        type,
        title,
        message,
        data: data || {},
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    } catch (error) {
      console.error('Bulk notification error:', error);
    }
  },

  async getUserNotifications(userId: string, companyId: string, unreadOnly = false) {
    const where: any = { userId, companyId };
    if (unreadOnly) where.isRead = false;

    const [notifications, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId, companyId, isRead: false } }),
    ]);

    return { notifications, unreadCount };
  },

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  async markAllAsRead(userId: string, companyId: string) {
    return prisma.notification.updateMany({
      where: { userId, companyId, isRead: false },
      data: { isRead: true },
    });
  },

  async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  },

  // Check e crea notifiche per scadenze subscription
  async checkSubscriptionExpiry() {
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in1day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Trial in scadenza
    const expiringTrials = await prisma.subscription.findMany({
      where: {
        status: 'TRIAL',
        trialEnd: { lte: in7days, gte: now },
      },
      include: { company: true },
    });

    for (const sub of expiringTrials) {
      const daysLeft = Math.ceil((sub.trialEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      await this.createForAllCompanyUsers(
        sub.companyId,
        NotificationType.SUBSCRIPTION_EXPIRING,
        'Periodo di prova in scadenza',
        `Il tuo periodo di prova scade tra ${daysLeft} giorn${daysLeft === 1 ? 'o' : 'i'}. Attiva un abbonamento per continuare.`,
        { daysLeft, type: 'trial' }
      );
    }

    // Abbonamenti in scadenza
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: in7days, gte: now },
      },
    });

    for (const sub of expiringSubscriptions) {
      const daysLeft = Math.ceil((sub.endDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      await this.createForAllCompanyUsers(
        sub.companyId,
        NotificationType.SUBSCRIPTION_EXPIRING,
        'Abbonamento in scadenza',
        `Il tuo abbonamento scade tra ${daysLeft} giorn${daysLeft === 1 ? 'o' : 'i'}. Rinnova per continuare.`,
        { daysLeft, type: 'subscription' }
      );
    }
  },

  // Check scadenza fatture
  async checkInvoiceDueDates() {
    const now = new Date();
    const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const dueSoonInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['ISSUED', 'DUE', 'PARTIALLY_PAID'] },
        dueDate: { lte: in3days, gte: now },
      },
      include: { company: true, client: true },
    });

    for (const invoice of dueSoonInvoices) {
      const daysLeft = invoice.dueDate
        ? Math.ceil((invoice.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      await this.createForAllCompanyUsers(
        invoice.companyId,
        NotificationType.INVOICE_DUE_SOON,
        'Fattura in scadenza',
        `La fattura ${invoice.number} scade tra ${daysLeft} giorn${daysLeft === 1 ? 'o' : 'i'}.`,
        { invoiceId: invoice.id, invoiceNumber: invoice.number }
      );
    }
  },
};
