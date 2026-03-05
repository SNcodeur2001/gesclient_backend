import { Injectable, Inject } from '@nestjs/common';
import type { CollecteRepository } from '../../domain/ports/repositories/collecte.repository';
import {
  COLLECTE_REPOSITORY,
} from '../../domain/ports/repositories/collecte.repository';
import type { ClientRepository } from '../../domain/ports/repositories/client.repository';
import {
  CLIENT_REPOSITORY,
} from '../../domain/ports/repositories/client.repository';
import type { NotificationRepository } from '../../domain/ports/repositories/notification.repository';
import {
  NOTIFICATION_REPOSITORY,
} from '../../domain/ports/repositories/notification.repository';
import type { AuditLogRepository } from '../../domain/ports/repositories/audit-log.repository';
import {
  AUDIT_LOG_REPOSITORY,
} from '../../domain/ports/repositories/audit-log.repository';
import { Collecte } from
  '../../domain/entities/collecte.entity';
import { ClientType } from
  '../../domain/enums/client-type.enum';
import { ClientStatut } from
  '../../domain/enums/client-statut.enum';
import { AuditAction } from
  '../../domain/enums/audit-action.enum';
import { NotificationType } from
  '../../domain/enums/notification-type.enum';

export interface CreateCollecteInput {
  apporteurId?: string;
  quantiteKg: number;
  prixUnitaire: number;
  notes?: string;
  apporteurInfo?: { nom: string; telephone?: string };
  collecteurId: string;
  directeurId?: string;
}

@Injectable()
export class CreateCollecteUseCase {
  constructor(
    @Inject(COLLECTE_REPOSITORY)
    private readonly collecteRepo: CollecteRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifRepo: NotificationRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(input: CreateCollecteInput): Promise<Collecte> {
    let apporteurId = input.apporteurId;

    // Créer l'apporteur à la volée si absent
    if (!apporteurId && input.apporteurInfo) {
      const apporteur = await this.clientRepo.create({
        nom: input.apporteurInfo.nom,
        telephone: input.apporteurInfo.telephone,
        type: ClientType.APPORTEUR,
        statut: ClientStatut.ACTIF,
        totalRevenue: 0,
        assignedUserId: input.collecteurId,
      });
      apporteurId = apporteur.id;
    }

    // Calcul montant
    const montantTotal = Collecte.calculerMontant(
      input.quantiteKg,
      input.prixUnitaire,
    );

    // Créer la collecte
    const collecte = await this.collecteRepo.create({
      apporteurId: apporteurId!,
      quantiteKg: input.quantiteKg,
      prixUnitaire: input.prixUnitaire,
      montantTotal,
      notes: input.notes,
      collecteurId: input.collecteurId,
    });

    // Audit
    await this.auditRepo.log({
      userId: input.collecteurId,
      action: AuditAction.CREATE,
      entite: 'Collecte',
      entiteId: collecte.id,
      nouvelleValeur: {
        quantiteKg: input.quantiteKg,
        montantTotal,
      },
    });

    // Notification directeur
    if (input.directeurId) {
      await this.notifRepo.create({
        userId: input.directeurId,
        type: NotificationType.NOUVELLE_COLLECTE,
        message: `Nouvelle collecte : ${input.quantiteKg} kg `
          + `pour ${montantTotal.toLocaleString()} FCFA`,
        lien: `/collectes/${collecte.id}`,
      });
    }

    return collecte;
  }
}