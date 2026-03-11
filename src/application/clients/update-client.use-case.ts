import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
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
import { Role } from '../../domain/enums/role.enum';
import { ClientType } from '../../domain/enums/client-type.enum';
import { AuditAction } from '../../domain/enums/audit-action.enum';
import { Client } from '../../domain/entities/client.entity';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryType,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepositoryType,
  ) {}

  async execute(
    id: string,
    data: Partial<Client>,
    userRole: Role,
    userId: string,
  ): Promise<Client> {
    const existing = await this.clientRepo.findById(id);
    if (!existing) throw new ClientNotFoundException(id);

    // Vérifier périmètre
    if (
      userRole === Role.COMMERCIAL &&
      existing.type === ClientType.APPORTEUR
    ) {
      throw new ForbiddenException('Accès refusé');
    }
    if (userRole === Role.COLLECTEUR && existing.type === ClientType.ACHETEUR) {
      throw new ForbiddenException('Accès refusé');
    }

    const updated = await this.clientRepo.update(id, data);

    await this.auditRepo.log({
      userId,
      action: AuditAction.UPDATE,
      entite: 'Client',
      entiteId: id,
      ancienneValeur: { ...existing },
      nouvelleValeur: { ...data },
    });

    return updated;
  }
}
