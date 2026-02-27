import { AuditLog } from '../../entities/audit-log.entity';
import { AuditAction } from '../../enums/audit-action.enum';

export const AUDIT_LOG_REPOSITORY = 'AUDIT_LOG_REPOSITORY';

export interface AuditLogRepository {
  log(
    data: Omit<AuditLog, 'id' | 'createdAt'>,
  ): Promise<void>;
  findAll(filters: {
    userId?: string;
    action?: AuditAction;
    entite?: string;
    dateDebut?: Date;
    dateFin?: Date;
    page: number;
    limit: number;
  }): Promise<{ items: AuditLog[]; total: number }>;
}
