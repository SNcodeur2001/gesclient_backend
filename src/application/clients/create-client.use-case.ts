import { Injectable, Inject } from '@nestjs/common';
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
import { ClientAlreadyExistsException } from
  '../../domain/exceptions/client-already-exists.exception';
import { Role } from '../../domain/enums/role.enum';
import { ClientType } from
  '../../domain/enums/client-type.enum';
import { ClientStatut } from
  '../../domain/enums/client-statut.enum';
import { AuditAction } from
  '../../domain/enums/audit-action.enum';
import { NotificationType } from
  '../../domain/enums/notification-type.enum';
import { Client } from '../../domain/entities/client.entity';

export interface CreateClientInput {
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  notes?: string;
  type?: ClientType;
  userRole: Role;
  userId: string;
  directeurId?: string;
}

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryType,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifRepo: NotificationRepositoryType,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepositoryType,
  ) {}

  async execute(input: CreateClientInput): Promise<Client> {
    // Type auto selon rôle
    let type = input.type;
    if (input.userRole === Role.COMMERCIAL) {
      type = ClientType.ACHETEUR;
    } else if (input.userRole === Role.COLLECTEUR) {
      type = ClientType.APPORTEUR;
    }

    // Vérifier doublon email
    if (input.email) {
      const existing = await this.clientRepo.findByEmail(
        input.email,
      );
      if (existing) {
        throw new ClientAlreadyExistsException(input.email);
      }
    }

    const client = await this.clientRepo.create({
      nom: input.nom,
      prenom: input.prenom,
      email: input.email,
      telephone: input.telephone,
      adresse: input.adresse,
      notes: input.notes,
      type: type!,
      statut: ClientStatut.PROSPECT,
      totalRevenue: 0,
      assignedUserId: input.userId,
    });

    await this.auditRepo.log({
      userId: input.userId,
      action: AuditAction.CREATE,
      entite: 'Client',
      entiteId: client.id,
      nouvelleValeur: { nom: client.nom, type: client.type },
    });

    if (input.directeurId) {
      await this.notifRepo.create({
        userId: input.directeurId,
        type: NotificationType.NOUVELLE_COLLECTE,
        message: `Nouveau client créé : ${client.nom}`,
        lien: `/clients/${client.id}`,
        clientId: client.id,
      });
    }

    return client;
  }
}