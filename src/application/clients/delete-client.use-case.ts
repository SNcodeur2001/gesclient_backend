import { Injectable, Inject } from '@nestjs/common';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
} from '../../domain/ports/repositories/client.repository';
import type { ClientRepository as ClientRepositoryType } from '../../domain/ports/repositories/client.repository';
import {
  AuditLogRepository,
  AUDIT_LOG_REPOSITORY,
} from '../../domain/ports/repositories/audit-log.repository';
import type { AuditLogRepository as AuditLogRepositoryType } from '../../domain/ports/repositories/audit-log.repository';
import { ClientNotFoundException } from '../../domain/exceptions/client-not-found.exception';
import { AuditAction } from '../../domain/enums/audit-action.enum';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryType,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepositoryType,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const client = await this.clientRepo.findById(id);
    if (!client) throw new ClientNotFoundException(id);

    await this.clientRepo.softDelete(id);

    await this.auditRepo.log({
      userId,
      action: AuditAction.DELETE,
      entite: 'Client',
      entiteId: id,
      ancienneValeur: { nom: client.nom },
    });
  }
}
