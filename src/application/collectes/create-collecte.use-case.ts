import { Injectable, Inject } from '@nestjs/common';
import type { CollecteRepository } from '../../domain/ports/repositories/collecte.repository';
import { COLLECTE_REPOSITORY } from '../../domain/ports/repositories/collecte.repository';
import type { ClientRepository } from '../../domain/ports/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../domain/ports/repositories/client.repository';
import type { NotificationRepository } from '../../domain/ports/repositories/notification.repository';
import { NOTIFICATION_REPOSITORY } from '../../domain/ports/repositories/notification.repository';
import type { AuditLogRepository } from '../../domain/ports/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/ports/repositories/audit-log.repository';
import type { UserRepository } from '../../domain/ports/repositories/user.repository';
import { USER_REPOSITORY } from '../../domain/ports/repositories/user.repository';
import { Collecte } from '../../domain/entities/collecte.entity';
import { ClientType } from '../../domain/enums/client-type.enum';
import { ClientStatut } from '../../domain/enums/client-statut.enum';
import { AuditAction } from '../../domain/enums/audit-action.enum';
import { NotificationType } from '../../domain/enums/notification-type.enum';

/**
 * Input DTO pour un item de collecte
 */
export interface CollecteItemInput {
  typePlastique: string;
  quantiteKg: number;
  prixUnitaire: number;
}

export interface CreateCollecteInput {
  apporteurId?: string;
  // Ancien système - un seul type
  quantiteKg?: number;
  prixUnitaire?: number;
  // Nouveau système - plusieurs types
  items?: CollecteItemInput[];
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
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
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

    // Déterminer les types de plastiques (nouveau système ou ancien)
    let items: CollecteItemInput[] = [];
    let quantiteKg: number | undefined;
    let prixUnitaire: number | undefined;

    if (input.items && input.items.length > 0) {
      // Nouveau système: plusieurs types
      items = input.items;
    } else if (
      input.quantiteKg !== undefined &&
      input.prixUnitaire !== undefined
    ) {
      // Ancien système: un seul type (backward compatibility)
      quantiteKg = input.quantiteKg;
      prixUnitaire = input.prixUnitaire;
      items = [{ typePlastique: 'Plastique', quantiteKg, prixUnitaire }];
    } else {
      throw new Error(
        'Veuillez fournir soit un type (quantiteKg, prixUnitaire) soit une liste de types (items)',
      );
    }

    // Calcul montant total et poids total
    let montantTotal = 0;
    let poidsTotal = 0;
    for (const item of items) {
      montantTotal += item.quantiteKg * item.prixUnitaire;
      poidsTotal += item.quantiteKg;
    }

    // Créer la collecte
    const collecte = await this.collecteRepo.create({
      apporteurId: apporteurId!,
      // Toujours stocker le poids total pour éviter les 0kg sur le multi-type
      quantiteKg: poidsTotal,
      prixUnitaire: items.length === 1 ? items[0].prixUnitaire : null,
      montantTotal,
      notes: input.notes,
      collecteurId: input.collecteurId,
      // Les items seront créés via une relation
      items: items as any,
    });

    // Audit
    await this.auditRepo.log({
      userId: input.collecteurId,
      action: AuditAction.CREATE,
      entite: 'Collecte',
      entiteId: collecte.id,
      description: `Collecte de ${poidsTotal.toLocaleString()} kg enregistrée pour ${(await this.clientRepo.findById(apporteurId!))?.nom || 'Inconnu'}`,
      nouvelleValeur: {
        montantTotal,
        itemsCount: items.length,
      },
    });

    // Notification directeur
    try {
      const directeur = await this.userRepo.findDirecteur();
      if (directeur) {
        await this.notifRepo.create({
          userId: directeur.id,
          type: NotificationType.NOUVELLE_COLLECTE,
          message:
            `Nouvelle collecte : ${items.length} type(s) ` +
            `pour ${montantTotal.toLocaleString()} FCFA`,
          lien: `/collectes/${collecte.id}`,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
    }

    return collecte;
  }
}
