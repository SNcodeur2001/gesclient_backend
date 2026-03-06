import { Injectable, Inject } from '@nestjs/common';
import {
  AuditLogRepository,
  AUDIT_LOG_REPOSITORY,
} from '../../domain/ports/repositories/audit-log.repository';
import type { AuditLogRepository as AuditLogRepositoryType } from '../../domain/ports/repositories/audit-log.repository';
import { AuditAction } from '../../domain/enums/audit-action.enum';
import { AuditLog } from '../../domain/entities/audit-log.entity';

export interface GetAuditLogsInput {
  userId?: string;
  action?: AuditAction;
  entite?: string;
  dateDebut?: Date;
  dateFin?: Date;
  page: number;
  limit: number;
}

@Injectable()
export class GetAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepositoryType,
  ) {}

  async execute(input: GetAuditLogsInput): Promise<{
    items: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.auditRepo.findAll({
      userId: input.userId,
      action: input.action,
      entite: input.entite,
      dateDebut: input.dateDebut,
      dateFin: input.dateFin,
      page: input.page,
      limit: input.limit,
    });

    return {
      ...result,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(result.total / input.limit),
    };
  }
}
