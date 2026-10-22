import { prisma } from '../../config/database';
import { AuditAction } from '@prisma/client';

interface AuditLogInput {
  userId?: string;
  companyId?: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  oldData?: object;
  newData?: object;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

export const auditService = {
  async log(input: AuditLogInput) {
    try {
      await prisma.auditLog.create({ data: input });
    } catch {
      // Non bloccare mai l'operazione principale per un errore di audit
      console.error('Audit log error:', input);
    }
  },

  async getCompanyLogs(companyId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where: { companyId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: { companyId } }),
    ]);
    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getGlobalLogs(page = 1, limit = 50, filters?: { companyId?: string; action?: AuditAction }) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters?.companyId) where.companyId = filters.companyId;
    if (filters?.action) where.action = filters.action;

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          company: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
  },
};
