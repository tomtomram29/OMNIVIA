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

// Helper: calcolo totali riga fattura
function calculateItemTotals(item: { quantity: number; unitPrice: number; discount: number; vatRate: number }) {
  const qty = new Decimal(item.quantity);
  const price = new Decimal(item.unitPrice);
  const disc = new Decimal(item.discount || 0);
  const vat = new Decimal(item.vatRate || 22);

  const lineSubtotal = qty.mul(price);
  const discountAmount = lineSubtotal.mul(disc).div(100);
  const subtotal = lineSubtotal.sub(discountAmount);
  const vatAmount = subtotal.mul(vat).div(100);
  const total = subtotal.add(vatAmount);

  return {
    subtotal: subtotal.toDecimalPlaces(2),
    vatAmount: vatAmount.toDecimalPlaces(2),
    total: total.toDecimalPlaces(2),
  };
}

// Helper: genera numero fattura
async function generateInvoiceNumber(companyId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { invoicePrefix: true, invoiceNextNumber: true },
  });
  const prefix = company?.invoicePrefix || 'FT';
  const nextNum = company?.invoiceNextNumber || 1;
  const year = new Date().getFullYear();
  const number = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;

  await prisma.company.update({
    where: { id: companyId },
    data: { invoiceNextNumber: nextNum + 1 },
  });

  return number;
}

// ============================================================
// Lista fatture
// ============================================================
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const skip = (page - 1) * limit;
    const where: any = { companyId: req.user!.companyId! };

    if (req.query.search) {
      where.OR = [
        { number: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }
    if (req.query.status) where.status = req.query.status;
    if (req.query.clientId) where.clientId = req.query.clientId;

    const [invoices, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
          _count: { select: { items: true, invoicePayments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ success: true, data: { invoices, total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// ============================================================
// Statistiche fatture (per dashboard)
// ============================================================
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const now = new Date();

    // Aggiorna fatture scadute
    await prisma.invoice.updateMany({
      where: {
        companyId,
        status: { in: ['ISSUED', 'DUE', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });

    const [draft, issued, due, partiallyPaid, paid, overdue, cancelled] = await prisma.$transaction([
      prisma.invoice.count({ where: { companyId, status: 'DRAFT' } }),
      prisma.invoice.count({ where: { companyId, status: 'ISSUED' } }),
      prisma.invoice.count({ where: { companyId, status: 'DUE' } }),
      prisma.invoice.count({ where: { companyId, status: 'PARTIALLY_PAID' } }),
      prisma.invoice.count({ where: { companyId, status: 'PAID' } }),
      prisma.invoice.count({ where: { companyId, status: 'OVERDUE' } }),
      prisma.invoice.count({ where: { companyId, status: 'CANCELLED' } }),
    ]);

    const totals = await prisma.invoice.aggregate({
      where: { companyId, status: { notIn: ['DRAFT', 'CANCELLED'] } },
      _sum: { total: true, paidAmount: true, remainingAmount: true },
    });

    res.json({
      success: true,
      data: {
        draft, issued, due, partiallyPaid, paid, overdue, cancelled,
        totalBilled: totals._sum.total || 0,
        totalPaid: totals._sum.paidAmount || 0,
        totalRemaining: totals._sum.remainingAmount || 0,
      },
    });
  } catch (error) { next(error); }
});

// ============================================================
// Dettaglio fattura
// ============================================================
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
      include: {
        client: true,
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
            service: { select: { id: true, name: true, code: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        invoicePayments: { orderBy: { paidAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!invoice) { res.status(404).json({ success: false, message: 'Fattura non trovata.' }); return; }
    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
});

// ============================================================
// Crea fattura
// ============================================================
router.post('/', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId, dueDate, paymentMethod, notes, internalNotes, items, quoteId } = req.body;
    const companyId = req.user!.companyId!;
    const number = await generateInvoiceNumber(companyId);

    let subtotal = new Decimal(0);
    let totalVat = new Decimal(0);
    let totalAmount = new Decimal(0);

    const processedItems = (items || []).map((item: any, index: number) => {
      const calc = calculateItemTotals(item);
      subtotal = subtotal.add(calc.subtotal);
      totalVat = totalVat.add(calc.vatAmount);
      totalAmount = totalAmount.add(calc.total);

      return {
        itemType: item.itemType || 'PRODUCT',
        productId: item.productId || null,
        serviceId: item.serviceId || null,
        description: item.description || '',
        quantity: new Decimal(item.quantity),
        unitPrice: new Decimal(item.unitPrice),
        discount: new Decimal(item.discount || 0),
        vatRate: new Decimal(item.vatRate || 22),
        subtotal: calc.subtotal,
        vatAmount: calc.vatAmount,
        total: calc.total,
        sortOrder: index,
      };
    });

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        number,
        clientId: clientId || null,
        issueDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentMethod: paymentMethod || null,
        subtotal,
        taxable: subtotal,
        vatAmount: totalVat,
        total: totalAmount,
        paidAmount: new Decimal(0),
        remainingAmount: totalAmount,
        notes,
        internalNotes,
        quoteId: quoteId || null,
        items: { create: processedItems },
      },
      include: {
        client: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    await auditService.log({
      userId: req.user!.id,
      companyId,
      action: 'CREATE',
      entity: 'Invoice',
      entityId: invoice.id,
      description: `Nuova fattura: ${number}`,
    });

    res.status(201).json({ success: true, data: invoice, message: 'Fattura creata.' });
  } catch (error) { next(error); }
});

// ============================================================
// Aggiorna fattura
// ============================================================
router.patch('/:id', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
    });
    if (!existing) { res.status(404).json({ success: false, message: 'Fattura non trovata.' }); return; }

    // Se la fattura è già emessa, limita le modifiche
    if (existing.status !== 'DRAFT' && req.body.items) {
      res.status(400).json({ success: false, message: 'Non è possibile modificare le righe di una fattura già emessa.' });
      return;
    }

    if (req.body.items) {
      let subtotal = new Decimal(0);
      let totalVat = new Decimal(0);
      let totalAmount = new Decimal(0);

      const processedItems = req.body.items.map((item: any, index: number) => {
        const calc = calculateItemTotals(item);
        subtotal = subtotal.add(calc.subtotal);
        totalVat = totalVat.add(calc.vatAmount);
        totalAmount = totalAmount.add(calc.total);

        return {
          itemType: item.itemType || 'PRODUCT',
          productId: item.productId || null,
          serviceId: item.serviceId || null,
          description: item.description || '',
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          discount: new Decimal(item.discount || 0),
          vatRate: new Decimal(item.vatRate || 22),
          subtotal: calc.subtotal,
          vatAmount: calc.vatAmount,
          total: calc.total,
          sortOrder: index,
        };
      });

      await prisma.invoiceItem.deleteMany({ where: { invoiceId: req.params.id } });

      const paidAmount = existing.paidAmount;
      const remainingAmount = totalAmount.sub(paidAmount);

      const invoice = await prisma.invoice.update({
        where: { id: req.params.id },
        data: {
          clientId: req.body.clientId !== undefined ? req.body.clientId : undefined,
          status: req.body.status || undefined,
          dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
          paymentMethod: req.body.paymentMethod || undefined,
          subtotal,
          taxable: subtotal,
          vatAmount: totalVat,
          total: totalAmount,
          remainingAmount,
          notes: req.body.notes !== undefined ? req.body.notes : undefined,
          internalNotes: req.body.internalNotes !== undefined ? req.body.internalNotes : undefined,
          items: { create: processedItems },
        },
        include: { client: true, items: { orderBy: { sortOrder: 'asc' } } },
      });

      await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'UPDATE', entity: 'Invoice', entityId: invoice.id });
      res.json({ success: true, data: invoice, message: 'Fattura aggiornata.' });
    } else {
      const updateData: any = {};
      if (req.body.clientId !== undefined) updateData.clientId = req.body.clientId;
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.dueDate) updateData.dueDate = new Date(req.body.dueDate);
      if (req.body.paymentMethod !== undefined) updateData.paymentMethod = req.body.paymentMethod;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;
      if (req.body.internalNotes !== undefined) updateData.internalNotes = req.body.internalNotes;

      const invoice = await prisma.invoice.update({
        where: { id: req.params.id },
        data: updateData,
        include: { client: true, items: { orderBy: { sortOrder: 'asc' } } },
      });

      await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'UPDATE', entity: 'Invoice', entityId: invoice.id });
      res.json({ success: true, data: invoice, message: 'Fattura aggiornata.' });
    }
  } catch (error) { next(error); }
});

// ============================================================
// Crea fattura da preventivo
// ============================================================
router.post('/from-quote/:quoteId', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.quoteId, companyId: req.user!.companyId! },
      include: { items: true },
    });
    if (!quote) { res.status(404).json({ success: false, message: 'Preventivo non trovato.' }); return; }

    const companyId = req.user!.companyId!;
    const number = await generateInvoiceNumber(companyId);

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        number,
        clientId: quote.clientId,
        issueDate: new Date(),
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        paymentMethod: req.body.paymentMethod || null,
        subtotal: quote.subtotal,
        discount: quote.discount,
        discountType: quote.discountType,
        taxable: quote.taxable,
        vatAmount: quote.vatAmount,
        total: quote.total,
        paidAmount: new Decimal(0),
        remainingAmount: quote.total,
        quoteId: quote.id,
        items: {
          create: quote.items.map((item) => ({
            itemType: item.itemType,
            productId: item.productId,
            serviceId: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            vatRate: item.vatRate,
            subtotal: item.subtotal,
            vatAmount: item.vatAmount,
            total: item.total,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: { client: true, items: true },
    });

    await auditService.log({
      userId: req.user!.id,
      companyId,
      action: 'CREATE',
      entity: 'Invoice',
      entityId: invoice.id,
      description: `Fattura da preventivo ${quote.number}: ${number}`,
    });

    res.status(201).json({ success: true, data: invoice, message: 'Fattura creata da preventivo.' });
  } catch (error) { next(error); }
});

// ============================================================
// Elimina fattura (solo bozza)
// ============================================================
router.delete('/:id', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Fattura non trovata.' }); return; }

    if (existing.status !== 'DRAFT') {
      // Per le fatture emesse, permetti solo annullamento
      await prisma.invoice.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
      await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'UPDATE', entity: 'Invoice', entityId: req.params.id, description: `Fattura annullata: ${existing.number}` });
      res.json({ success: true, message: 'Fattura annullata.' });
    } else {
      await prisma.invoice.delete({ where: { id: req.params.id } });
      await auditService.log({ userId: req.user!.id, companyId: req.user!.companyId!, action: 'DELETE', entity: 'Invoice', entityId: req.params.id, description: `Fattura eliminata: ${existing.number}` });
      res.json({ success: true, message: 'Fattura eliminata.' });
    }
  } catch (error) { next(error); }
});

export default router;
