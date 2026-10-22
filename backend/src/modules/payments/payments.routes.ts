import { Router } from 'express';
import { authenticate, requireCompany, requireRole } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { UserRole, InvoiceStatus } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();
router.use(authenticate, requireCompany, checkSubscription);

// ============================================================
// Lista pagamenti di una fattura
// ============================================================
router.get('/invoice/:invoiceId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Verifica che la fattura appartenga all'azienda
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.invoiceId, companyId: req.user!.companyId! },
    });
    if (!invoice) { res.status(404).json({ success: false, message: 'Fattura non trovata.' }); return; }

    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId: req.params.invoiceId },
      orderBy: { paidAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        payments,
        invoiceTotal: invoice.total,
        paidAmount: invoice.paidAmount,
        remainingAmount: invoice.remainingAmount,
      },
    });
  } catch (error) { next(error); }
});

// ============================================================
// Registra pagamento
// ============================================================
router.post('/invoice/:invoiceId', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, method, paidAt, notes } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'Importo non valido.' });
      return;
    }

    // Verifica fattura
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.invoiceId, companyId: req.user!.companyId! },
    });
    if (!invoice) { res.status(404).json({ success: false, message: 'Fattura non trovata.' }); return; }

    if (invoice.status === 'DRAFT') {
      res.status(400).json({ success: false, message: 'Non è possibile registrare pagamenti per una fattura in bozza.' });
      return;
    }
    if (invoice.status === 'CANCELLED') {
      res.status(400).json({ success: false, message: 'Non è possibile registrare pagamenti per una fattura annullata.' });
      return;
    }
    if (invoice.status === 'PAID') {
      res.status(400).json({ success: false, message: 'La fattura è già completamente pagata.' });
      return;
    }

    const paymentAmount = new Decimal(amount);
    const remaining = new Decimal(invoice.remainingAmount.toString());

    if (paymentAmount.greaterThan(remaining)) {
      res.status(400).json({
        success: false,
        message: `L'importo supera il residuo (€${remaining.toFixed(2)}). Importo massimo consentito: €${remaining.toFixed(2)}.`,
      });
      return;
    }

    // Crea pagamento e aggiorna fattura in transazione
    const newPaidAmount = new Decimal(invoice.paidAmount.toString()).add(paymentAmount);
    const newRemainingAmount = new Decimal(invoice.total.toString()).sub(newPaidAmount);

    let newStatus: InvoiceStatus = invoice.status;
    if (newRemainingAmount.lessThanOrEqualTo(0)) {
      newStatus = 'PAID';
    } else if (newPaidAmount.greaterThan(0)) {
      newStatus = 'PARTIALLY_PAID';
    }

    const [payment] = await prisma.$transaction([
      prisma.invoicePayment.create({
        data: {
          invoiceId: req.params.invoiceId,
          amount: paymentAmount,
          method: method || 'BANK_TRANSFER',
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          notes,
        },
      }),
      prisma.invoice.update({
        where: { id: req.params.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
      }),
    ]);

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'CREATE',
      entity: 'InvoicePayment',
      entityId: payment.id,
      description: `Pagamento €${paymentAmount.toFixed(2)} su fattura ${invoice.number}`,
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: `Pagamento di €${paymentAmount.toFixed(2)} registrato. ${newStatus === 'PAID' ? 'Fattura completamente pagata.' : `Residuo: €${newRemainingAmount.toFixed(2)}`}`,
    });
  } catch (error) { next(error); }
});

// ============================================================
// Elimina pagamento
// ============================================================
router.delete('/:id', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.invoicePayment.findUnique({
      where: { id: req.params.id },
      include: { invoice: true },
    });
    if (!payment) { res.status(404).json({ success: false, message: 'Pagamento non trovato.' }); return; }

    // Verifica tenant
    const invoice = await prisma.invoice.findFirst({
      where: { id: payment.invoiceId, companyId: req.user!.companyId! },
    });
    if (!invoice) { res.status(403).json({ success: false, message: 'Accesso negato.' }); return; }

    const paymentAmount = new Decimal(payment.amount.toString());
    const newPaidAmount = new Decimal(invoice.paidAmount.toString()).sub(paymentAmount);
    const newRemainingAmount = new Decimal(invoice.total.toString()).sub(newPaidAmount);

    let newStatus: InvoiceStatus = invoice.status;
    if (newPaidAmount.lessThanOrEqualTo(0)) {
      newStatus = 'DUE';
    } else {
      newStatus = 'PARTIALLY_PAID';
    }

    await prisma.$transaction([
      prisma.invoicePayment.delete({ where: { id: req.params.id } }),
      prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
      }),
    ]);

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'DELETE',
      entity: 'InvoicePayment',
      entityId: req.params.id,
      description: `Pagamento eliminato da fattura ${invoice.number}`,
    });

    res.json({ success: true, message: 'Pagamento eliminato.' });
  } catch (error) { next(error); }
});

export default router;
