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
import {
  UserRepository,
  USER_REPOSITORY,
} from '../../domain/ports/repositories/user.repository';
import type { UserRepository as UserRepositoryType } from '../../domain/ports/repositories/user.repository';
import { Role } from '../../domain/enums/role.enum';
import { ClientType } from '../../domain/enums/client-type.enum';
import { ClientStatut } from '../../domain/enums/client-statut.enum';
import { AuditAction } from '../../domain/enums/audit-action.enum';

@Injectable()
export class ExportClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryType,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepositoryType,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryType,
  ) {}

  async execute(
    filters: { type?: ClientType; statut?: ClientStatut },
    userRole: Role,
    userId?: string,
  ): Promise<string> {
    // Forcer type selon rôle
    let type = filters.type;
    if (userRole === Role.COMMERCIAL) type = ClientType.ACHETEUR;
    if (userRole === Role.COLLECTEUR) type = ClientType.APPORTEUR;

    const clients = await this.clientRepo.exportAll({
      type,
      statut: filters.statut,
    });

    // Générer CSV
    const headers = 'nom,prenom,email,telephone,' + 'adresse,type,statut';
    const rows = clients.map((c) =>
      [
        c.nom,
        c.prenom || '',
        c.email || '',
        c.telephone || '',
        c.adresse || '',
        c.type,
        c.statut,
      ].join(','),
    );

    // Audit log si userId fourni
    if (userId) {
      const user = await this.userRepo.findById(userId);
      await this.auditRepo.log({
        userId,
        action: AuditAction.EXPORT,
        entite: 'Client',
        entiteId: 'bulk',
        description: `Export clients effectué par ${user?.prenom || ''} ${user?.nom || ''}`.trim(),
      });
    }

    return [headers, ...rows].join('\n');
  }
}
