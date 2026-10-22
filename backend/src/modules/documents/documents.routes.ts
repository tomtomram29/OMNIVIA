import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireCompany, requireRole } from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/subscription';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { config } from '../../config/env';

const router = Router();
router.use(authenticate, requireCompany, checkSubscription);

// Configurazione multer per upload
const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const companyId = req.user?.companyId || 'unknown';
    const uploadDir = path.join(config.UPLOAD_DIR, companyId);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/csv',
      'application/zip',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non consentito.'));
    }
  },
});

// ============================================================
// Lista documenti
// ============================================================
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const skip = (page - 1) * limit;
    const where: any = { companyId: req.user!.companyId! };

    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search as string, mode: 'insensitive' } },
        { originalName: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }
    if (req.query.type) where.type = req.query.type;
    if (req.query.clientId) where.clientId = req.query.clientId;
    if (req.query.taskId) where.taskId = req.query.taskId;
    if (req.query.quoteId) where.quoteId = req.query.quoteId;
    if (req.query.invoiceId) where.invoiceId = req.query.invoiceId;

    const [documents, total] = await prisma.$transaction([
      prisma.document.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
          client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    res.json({ success: true, data: { documents, total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// ============================================================
// Upload documento
// ============================================================
router.post('/', upload.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Nessun file caricato.' });
      return;
    }

    const { name, type, clientId, supplierId, taskId, quoteId, invoiceId } = req.body;

    const document = await prisma.document.create({
      data: {
        companyId: req.user!.companyId!,
        name: name || req.file.originalname,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        type: type || 'OTHER',
        uploadedById: req.user!.id,
        clientId: clientId || null,
        supplierId: supplierId || null,
        taskId: taskId || null,
        quoteId: quoteId || null,
        invoiceId: invoiceId || null,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'CREATE',
      entity: 'Document',
      entityId: document.id,
      description: `Documento caricato: ${document.originalName}`,
    });

    res.status(201).json({ success: true, data: document, message: 'Documento caricato.' });
  } catch (error) { next(error); }
});

// ============================================================
// Download documento
// ============================================================
router.get('/:id/download', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
    });
    if (!document) { res.status(404).json({ success: false, message: 'Documento non trovato.' }); return; }

    const filePath = path.resolve(document.path);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'File non trovato sul server.' });
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.originalName)}"`);
    res.setHeader('Content-Type', document.mimeType);
    res.sendFile(filePath);
  } catch (error) { next(error); }
});

// ============================================================
// Rinomina documento
// ============================================================
router.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
    });
    if (!existing) { res.status(404).json({ success: false, message: 'Documento non trovato.' }); return; }

    const updateData: any = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.type) updateData.type = req.body.type;

    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ success: true, data: document, message: 'Documento aggiornato.' });
  } catch (error) { next(error); }
});

// ============================================================
// Elimina documento
// ============================================================
router.delete('/:id', requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
    });
    if (!document) { res.status(404).json({ success: false, message: 'Documento non trovato.' }); return; }

    // Elimina file fisico
    try {
      const filePath = path.resolve(document.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Non bloccare per errore di eliminazione file
    }

    await prisma.document.delete({ where: { id: req.params.id } });

    await auditService.log({
      userId: req.user!.id,
      companyId: req.user!.companyId!,
      action: 'DELETE',
      entity: 'Document',
      entityId: req.params.id,
      description: `Documento eliminato: ${document.originalName}`,
    });

    res.json({ success: true, message: 'Documento eliminato.' });
  } catch (error) { next(error); }
});

export default router;
