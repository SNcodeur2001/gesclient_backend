import { Injectable, Inject } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
} from '../../domain/ports/repositories/client.repository';
import type { ClientRepository as ClientRepositoryType } from '../../domain/ports/repositories/client.repository';
import { Role } from '../../domain/enums/role.enum';
import { ClientType } from '../../domain/enums/client-type.enum';
import { ClientStatut } from '../../domain/enums/client-statut.enum';

@Injectable()
export class ExportClientsExcelUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryType,
  ) {}

  async execute(
    filters: { type?: ClientType; statut?: ClientStatut },
    userRole: Role,
  ): Promise<Buffer> {
    // Forcer type selon rôle
    let type = filters.type;
    if (userRole === Role.COMMERCIAL) type = ClientType.ACHETEUR;
    if (userRole === Role.COLLECTEUR) type = ClientType.APPORTEUR;

    const clients = await this.clientRepo.exportAll({
      type,
      statut: filters.statut,
    });

    // Préparer les données pour Excel
    const data = clients.map(c => ({
      Nom: c.nom,
      Prénom: c.prenom || '',
      Email: c.email || '',
      Téléphone: c.telephone || '',
      Adresse: c.adresse || '',
      Type: c.type,
      Statut: c.statut,
    }));

    // Créer le workbook Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

    // Retourner le buffer
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }
}
