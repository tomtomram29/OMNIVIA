import { Router } from 'express';
import { authenticate, requireCompany, requireRole } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();
router.use(authenticate, requireCompany, checkSubscription);

// Helper: calcolo totali righe preventivo
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

// Helper: genera numero preventivo
async function generateQuoteNumber(companyId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { quotePrefix: true, quoteNextNumber: true },
  });
  const prefix = company?.quotePrefix || 'PV';
  const nextNum = company?.quoteNextNumber || 1;
  const year = new Date().getFullYear();
  const number = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;

  await prisma.company.update({
    where: { id: companyId },
    data: { quoteNextNumber: nextNum + 1 },
  });

  return number;
}

// ============================================================
// Lista preventivi
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

    const [quotes, total] = await prisma.$transaction([
      prisma.quote.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({ success: true, data: { quotes, total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// ============================================================
// Statistiche preventivi
// ============================================================
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [draft, sent, pending, accepted, rejected] = await prisma.$transaction([
      prisma.quote.count({ where: { companyId, status: 'DRAFT' } }),
      prisma.quote.count({ where: { companyId, status: 'SENT' } }),
      prisma.quote.count({ where: { companyId, status: 'PENDING' } }),
      prisma.quote.count({ where: { companyId, status: 'ACCEPTED' } }),
      prisma.quote.count({ where: { companyId, status: 'REJECTED' } }),
    ]);

    const totalValue = await prisma.quote.aggregate({
      where: { companyId, status: { in: ['ACCEPTED'] } },
      _sum: { total: true },
    });

    res.json({
      success: true,
      data: { draft, sent, pending, accepted, rejected, totalAcceptedValue: totalValue._sum.total || 0 },
    });
  } catch (error) { next(error); }
});

// ============================================================
// Dettaglio preventivo
// ============================================================
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const quote = await prisma.quote.findFirst({
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
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!quote) { res.status(404).json({ success: false, message: 'Preventivo non trovato.' }); return; }
    res.json({ success: true, data: quote });
  } catch (error) { next(error); }
});

// ============================================================
// Crea preventivo
// ============================================================
router.post('/', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId, expiryDate, notes, internalNotes, items, discountType, discount: headerDiscount } = req.body;
    const companyId = req.user!.companyId!;
    const number = await generateQuoteNumber(companyId);

    // Calcola totali
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

    const quote = await prisma.quote.create({
      data: {
        companyId,
        number,
        clientId: clientId || null,
        issueDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        subtotal,
        discount: new Decimal(headerDiscount || 0),
        discountType: discountType || 'AMOUNT',
        taxable: subtotal,
        vatAmount: totalVat,
        total: totalAmount,
        notes,
        internalNotes,
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
      entity: 'Quote',
      entityId: quote.id,
      description: `Nuovo preventivo: ${number}`,
    });

    res.status(201).json({ success: true, data: quote, message: 'Preventivo creato.' });
  } catch (error) { next(error); }
});

// ============================================================
// Aggiorna preventivo
// ============================================================
router.patch('/:id', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
    });
    if (!existing) { res.status(404).json({ success: false, message: 'Preventivo non trovato.' }); return; }

    // Se ha items, ricalcola tutto
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

      // Elimina vecchi items e ricrea
      await prisma.quoteItem.deleteMany({ where: { quoteId: req.params.id } });

      const quote = await prisma.quote.update({
        where: { id: req.params.id },
        data: {
          clientId: req.body.clientId !== undefined ? req.body.clientId : undefined,
          status: req.body.status || undefined,
          expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
          subtotal,
          taxable: subtotal,
          vatAmount: totalVat,
          total: totalAmount,
          discount: req.body.discount !== undefined ? new Decimal(req.body.discount) : undefined,
          discountType: req.body.discountType || undefined,
          notes: req.body.notes !== undefined ? req.body.notes : undefined,
          internalNotes: req.body.internalNotes !== undefined ? req.body.internalNotes : undefined,
          items: { create: processedItems },
        },
        include: {
          client: true,
          items: { orderBy: { sortOrder: 'asc' } },
        },
      });

      await auditService.log({
        userId: req.user!.id,
        companyId: req.user!.companyId!,
        action: 'UPDATE',
        entity: 'Quote',
        entityId: quote.id,
      });

      res.json({ success: true, data: quote, message: 'Preventivo aggiornato.' });
    } else {
      // Aggiorna solo campi header
      const updateData: any = {};
      if (req.body.clientId !== undefined) updateData.clientId = req.body.clientId;
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.expiryDate) updateData.expiryDate = new Date(req.body.expiryDate);
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;
      if (req.body.internalNotes !== undefined) updateData.internalNotes = req.body.internalNotes;

      const quote = await prisma.quote.update({
        where: { id: req.params.id },
        data: updateData,
        include: { client: true, items: { orderBy: { sortOrder: 'asc' } } },
      });

      await auditService.log({
        userId: req.user!.id,
        companyId: req.user!.companyId!,
        action: 'UPDATE',
        entity: 'Quote',
        entityId: quote.id,
      });

      res.json({ success: true, data: quote, message: 'Preventivo aggiornato.' });
    }
  } catch (error) { next(error); }
});

// ============================================================
// Duplica preventivo
// ============================================================
router.post('/:id/duplicate', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const original = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
      include: { items: true },
    });
    if (!original) { res.status(404).json({ success: false, message: 'Preventivo non trovato.' }); return; }

    const companyId = req.user!.companyId!;
    const newNumber = await generateQuoteNumber(companyId);

    const duplicate = await prisma.quote.create({
      data: {
        companyId,
        number: newNumber,
        clientId: original.clientId,
        status: 'DRAFT',
        issueDate: new Date(),
        expiryDate: original.expiryDate,
        subtotal: original.subtotal,
        discount: original.discount,
        discountType: original.discountType,
        taxable: original.taxable,
        vatAmount: original.vatAmount,
        total: original.total,
        notes: original.notes,
        items: {
          create: (original.items || []).map((item: any) => ({
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

    res.status(201).json({ success: true, data: duplicate, message: 'Preventivo duplicato.' });
  } catch (error) { next(error); }
});

// ============================================================
// Elimina preventivo
// ============================================================
router.delete('/:id', requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.quote.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) { res.status(404).json({ success: false, message: 'Preventivo non trovato.' }); return; }

    await prisma.quote.delete({ where: { id: req.params.id } });

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'DELETE',
      entity: 'Quote',
      entityId: req.params.id,
      description: `Preventivo eliminato: ${existing.number}`,
    });

    res.json({ success: true, message: 'Preventivo eliminato.' });
  } catch (error) { next(error); }
});

export default router;
