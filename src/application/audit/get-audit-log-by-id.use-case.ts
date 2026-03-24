import { Injectable, Inject } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY } from '../../domain/ports/repositories/audit-log.repository';
import type { AuditLogRepository as AuditLogRepositoryType } from '../../domain/ports/repositories/audit-log.repository';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class GetAuditLogByIdUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepositoryType,
  ) {}

  async execute(id: string): Promise<AuditLog | null> {
    return this.auditRepo.findById(id);
  }
}
