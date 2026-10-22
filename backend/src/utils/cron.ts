import cron from 'node-cron';
import { prisma } from '../config/database';
import { notificationService } from '../modules/notifications/notifications.service';
import { SubscriptionStatus } from '@prisma/client';

// ============================================================
// CRON JOBS
// Eseguiti automaticamente in background
// ============================================================

// Ogni giorno alle 02:00 — Controllo scadenze subscription
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Controllo scadenze subscription...');
  try {
    await notificationService.checkSubscriptionExpiry();

    // Auto-expire trial/subscription scaduti
    const now = new Date();

    // Scadenza trial
    const expiredTrials = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIAL,
        trialEnd: { lt: now },
      },
    });

    for (const sub of expiredTrials) {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.EXPIRED },
        }),
        prisma.company.update({
          where: { id: sub.companyId },
          data: { status: 'EXPIRED' },
        }),
      ]);

      await notificationService.createForAllCompanyUsers(
        sub.companyId,
        'SUBSCRIPTION_EXPIRED',
        'Periodo di prova scaduto',
        'Il tuo periodo di prova è terminato. Attiva un abbonamento per continuare ad utilizzare OMNIVIA.',
        { type: 'trial_expired' }
      );
    }

    // Scadenza abbonamento
    const expiredSubs = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: now },
      },
    });

    for (const sub of expiredSubs) {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.EXPIRED },
        }),
        prisma.company.update({
          where: { id: sub.companyId },
          data: { status: 'EXPIRED' },
        }),
      ]);

      await notificationService.createForAllCompanyUsers(
        sub.companyId,
        'SUBSCRIPTION_EXPIRED',
        'Abbonamento scaduto',
        'Il tuo abbonamento è scaduto. Rinnova per continuare ad utilizzare OMNIVIA.',
        { type: 'subscription_expired' }
      );
    }

    console.log(`[CRON] Scadenze processate. Trial scaduti: ${expiredTrials.length}, Abbonamenti scaduti: ${expiredSubs.length}`);
  } catch (error) {
    console.error('[CRON] Errore controllo scadenze:', error);
  }
});

// Ogni giorno alle 08:00 — Controllo scadenze fatture
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Controllo scadenze fatture...');
  try {
    await notificationService.checkInvoiceDueDates();

    // Auto-update fatture scadute
    const now = new Date();
    const updated = await prisma.invoice.updateMany({
      where: {
        status: { in: ['ISSUED', 'DUE', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });

    console.log(`[CRON] Fatture scadute aggiornate: ${updated.count}`);
  } catch (error) {
    console.error('[CRON] Errore controllo fatture:', error);
  }
});

// Ogni giorno alle 03:00 — Aggiorna attività scadute
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Aggiornamento attività scadute...');
  try {
    const now = new Date();

    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: now },
      },
      include: { company: true },
    });

    if (overdueTasks.length > 0) {
      await prisma.task.updateMany({
        where: {
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: now },
        },
        data: { status: 'OVERDUE' },
      });

      // Notifica per ogni task scaduta
      for (const task of overdueTasks) {
        if (task.assigneeId) {
          await notificationService.create({
            companyId: task.companyId,
            userId: task.assigneeId,
            type: 'TASK_OVERDUE',
            title: 'Attività scaduta',
            message: `L'attività "${task.title}" è scaduta.`,
            data: { taskId: task.id },
          });
        }
      }
    }

    console.log(`[CRON] Attività scadute aggiornate: ${overdueTasks.length}`);
  } catch (error) {
    console.error('[CRON] Errore aggiornamento attività:', error);
  }
});

console.log('⏰ Cron jobs inizializzati');
