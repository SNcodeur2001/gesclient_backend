import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditLogRepository } from '../../../domain/ports/repositories/audit-log.repository';
import { AuditLog } from '../../../domain/entities/audit-log.entity';
import { AuditAction } from '../../../domain/enums/audit-action.enum';

@Injectable()
export class PrismaAuditLogRepository
  implements AuditLogRepository {

  constructor(private readonly prisma: PrismaService) {}

  async log(
    data: Omit<AuditLog, 'id' | 'createdAt'>,
  ): Promise<void> {
    await this.prisma.auditLog.create({ data });
  }

  async findAll(filters: {
    userId?: string;
    action?: AuditAction;
    entite?: string;
    dateDebut?: Date;
    dateFin?: Date;
    page: number;
    limit: number;
  }): Promise<{ items: AuditLog[]; total: number }> {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entite) where.entite = filters.entite;
    if (filters.dateDebut || filters.dateFin) {
      where.createdAt = {};
      if (filters.dateDebut)
        where.createdAt.gte = filters.dateDebut;
      if (filters.dateFin)
        where.createdAt.lte = filters.dateFin;
    }

    const skip = (filters.page - 1) * filters.limit;
    const [raws, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: true },
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: raws.map(this.toDomain),
      total,
    };
  }

  private toDomain(raw: any): AuditLog {
    const log = new AuditLog();
    log.id = raw.id;
    log.userId = raw.userId;
    log.action = raw.action as AuditAction;
    log.entite = raw.entite;
    log.entiteId = raw.entiteId;
    log.ancienneValeur = raw.ancienneValeur;
    log.nouvelleValeur = raw.nouvelleValeur;
    log.createdAt = raw.createdAt;
    return log;
  }
}
