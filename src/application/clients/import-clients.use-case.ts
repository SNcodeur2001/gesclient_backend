import { Injectable, Inject } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
} from '../../domain/ports/repositories/client.repository';
import type { ClientRepository as ClientRepositoryType } from '../../domain/ports/repositories/client.repository';
import {
  NotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../../domain/ports/repositories/notification.repository';
import type { NotificationRepository as NotificationRepositoryType } from '../../domain/ports/repositories/notification.repository';
import {
  AuditLogRepository,
  AUDIT_LOG_REPOSITORY,
} from '../../domain/ports/repositories/audit-log.repository';
import type { AuditLogRepository as AuditLogRepositoryType } from '../../domain/ports/repositories/audit-log.repository';
import { Role } from '../../domain/enums/role.enum';
import { ClientType } from
  '../../domain/enums/client-type.enum';
import { ClientStatut } from
  '../../domain/enums/client-statut.enum';
import { AuditAction } from
  '../../domain/enums/audit-action.enum';
import { NotificationType } from
  '../../domain/enums/notification-type.enum';

export interface ImportError {
  ligne: number;
  raison: string;
}

export interface ImportResult {
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportError[];
  statut: string;
}

@Injectable()
export class ImportClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryType,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifRepo: NotificationRepositoryType,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepositoryType,
  ) {}

  async execute(
    buffer: Buffer,
    filename: string,
    userId: string,
    userRole: Role,
    directeurId?: string,
  ): Promise<ImportResult> {
    // Déterminer le type selon le rôle
    const type =
      userRole === Role.COLLECTEUR
        ? ClientType.APPORTEUR
        : ClientType.ACHETEUR;

    // Parser le fichier Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    const valides: any[] = [];
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const ligne = i + 2;

      // Validation
      if (!row.nom && !row.Nom) {
        errors.push({ ligne, raison: 'Nom manquant' });
        continue;
      }

      const email = row.email || row.Email;
      if (email && !/\S+@\S+\.\S+/.test(email)) {
        errors.push({ ligne, raison: 'Email invalide' });
        continue;
      }

      // Valider le type si fourni
      const typeImport = row.type || row.Type;
      let clientType = type;
      if (typeImport) {
        const typeUpper = typeImport.toString().toUpperCase().trim();
        if (typeUpper === 'APPORTEUR' || typeUpper === 'ACHETEUR') {
          clientType = ClientType[typeUpper as keyof typeof ClientType];
        }
      }

      // Valider le statut si fourni
      const statutImport = row.statut || row.Statut;
      let clientStatut = ClientStatut.PROSPECT;
      if (statutImport) {
        const statutUpper = statutImport.toString().toUpperCase().trim();
        if (statutUpper === 'ACTIF' || statutUpper === 'PROSPECT' || statutUpper === 'INACTIF') {
          clientStatut = ClientStatut[statutUpper as keyof typeof ClientStatut];
        }
      }

      if (email) {
        const existing = await this.clientRepo.findByEmail(
          email,
        );
        if (existing) {
          errors.push({
            ligne,
            raison: `Doublon email : ${email}`,
          });
          continue;
        }
      }

      valides.push({
        nom: row.nom || row.Nom,
        prenom: row.prenom || row.Prenom || null,
        email: email || null,
        telephone:
          row.telephone || row.Telephone || null,
        adresse: row.adresse || row.Adresse || null,
        type: clientType,
        statut: clientStatut,
        totalRevenue: 0,
      });
    }

    // Créer les clients valides
    const count = await this.clientRepo.createMany(valides);

    await this.auditRepo.log({
      userId,
      action: AuditAction.IMPORT,
      entite: 'Client',
      entiteId: 'bulk',
      nouvelleValeur: { count, filename },
    });

    if (directeurId) {
      await this.notifRepo.create({
        userId: directeurId,
        type: NotificationType.IMPORT_TERMINE,
        message: `Import ${filename} : ${count} créés, `
          + `${errors.length} erreurs`,
      });
    }

    return {
      filename,
      totalRows: rows.length,
      validRows: count,
      invalidRows: errors.length,
      errors,
      statut: 'TERMINE',
    };
  }
}