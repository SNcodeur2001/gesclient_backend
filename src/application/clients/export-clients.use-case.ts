import { Injectable, Inject } from '@nestjs/common';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
} from '../../domain/ports/repositories/client.repository';
import type { ClientRepository as ClientRepositoryType } from '../../domain/ports/repositories/client.repository';
import { Role } from '../../domain/enums/role.enum';
import { ClientType } from
  '../../domain/enums/client-type.enum';
import { ClientStatut } from
  '../../domain/enums/client-statut.enum';

@Injectable()
export class ExportClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryType,
  ) {}

  async execute(
    filters: { type?: ClientType; statut?: ClientStatut },
    userRole: Role,
  ): Promise<string> {
    // Forcer type selon rôle
    let type = filters.type;
    if (userRole === Role.COMMERCIAL)
      type = ClientType.ACHETEUR;
    if (userRole === Role.COLLECTEUR)
      type = ClientType.APPORTEUR;

    const clients = await this.clientRepo.exportAll({
      type,
      statut: filters.statut,
    });

    // Générer CSV
    const headers = 'nom,prenom,email,telephone,'
      + 'adresse,type,statut';
    const rows = clients.map(c =>
      [
        c.nom, c.prenom || '',
        c.email || '', c.telephone || '',
        c.adresse || '', c.type, c.statut,
      ].join(','),
    );

    return [headers, ...rows].join('\n');
  }
}