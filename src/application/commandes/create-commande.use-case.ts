import { Injectable, Inject } from '@nestjs/common';
import type { CommandeRepository } from '../../domain/ports/repositories/commande.repository';
import {
  COMMANDE_REPOSITORY,
  CreateCommandeData,
} from '../../domain/ports/repositories/commande.repository';
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
import { Commande } from
  '../../domain/entities/commande.entity';
import { CommandeType } from
  '../../domain/enums/commande-type.enum';
import { CommandeStatut } from
  '../../domain/enums/commande-statut.enum';
import { ClientType } from
  '../../domain/enums/client-type.enum';
import { ClientStatut } from
  '../../domain/enums/client-statut.enum';
import { AuditAction } from
  '../../domain/enums/audit-action.enum';
import { NotificationType } from
  '../../domain/enums/notification-type.enum';

export interface CreateCommandeInput {
  type: CommandeType;
  acheteurId?: string;
  acheteurInfo?: { nom: string; email?: string; telephone?: string };
  produit: string;
  quantite: number;
  prixUnitaire: number;
  commercialId: string;
  directeurId?: string;
}

@Injectable()
export class CreateCommandeUseCase {
  constructor(
    @Inject(COMMANDE_REPOSITORY)
    private readonly commandeRepo: CommandeRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifRepo: NotificationRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(input: CreateCommandeInput): Promise<Commande> {
    // 1. Résoudre l'acheteur
    let acheteurId = input.acheteurId;
    if (!acheteurId && input.acheteurInfo) {
      const acheteur = await this.clientRepo.create({
        nom: input.acheteurInfo.nom,
        email: input.acheteurInfo.email,
        telephone: input.acheteurInfo.telephone,
        type: ClientType.ACHETEUR,
        statut: ClientStatut.ACTIF,
        totalRevenue: 0,
        assignedUserId: input.commercialId,
      });
      acheteurId = acheteur.id;
    }

    // 2. Calculs métier via entité Domain
    const montantHT = input.quantite * input.prixUnitaire;
    const tva = Commande.calculerTVA(montantHT, input.type);
    const montantTTC = montantHT + tva;
    const acompteMinimum = Commande.calculerAcompteMinimum(
      montantTTC, input.type,
    );

    // 3. Statut initial selon type
    const isSurPlace = input.type === CommandeType.SUR_PLACE;
    const statut = isSurPlace
      ? CommandeStatut.FINALISEE
      : CommandeStatut.EN_ATTENTE_ACOMPTE;
    const acompteVerse = isSurPlace ? montantTTC : 0;
    const soldeRestant = isSurPlace ? 0 : montantTTC;

    // 4. Générer référence unique CMD-YYYY-XXXX
    const count = await this.commandeRepo.countAll();
    const year = new Date().getFullYear();
    const reference = `CMD-${year}-${String(count + 1).padStart(4, '0')}`;

    // 5. Persister
    const createData: CreateCommandeData = {
      reference,
      type: input.type,
      statut,
      acheteurId: acheteurId!,
      produit: input.produit,
      quantite: input.quantite,
      prixUnitaire: input.prixUnitaire,
      montantHT,
      tva,
      montantTTC,
      acompteMinimum,
      acompteVerse,
      soldeRestant,
      commercialId: input.commercialId,
    };
    const commande = await this.commandeRepo.create(createData);

    // 6. Si SUR_PLACE → mettre à jour revenue client
    if (isSurPlace) {
      const acheteur = await this.clientRepo.findById(
        acheteurId!,
      );
      if (acheteur) {
        await this.clientRepo.update(acheteurId!, {
          totalRevenue: acheteur.totalRevenue + montantTTC,
        });
      }
    }

    // 7. Audit + notification
    await this.auditRepo.log({
      userId: input.commercialId,
      action: AuditAction.CREATE,
      entite: 'Commande',
      entiteId: commande.id,
      nouvelleValeur: {
        reference,
        type: input.type,
        montantTTC,
        statut,
      },
    });

    if (input.directeurId) {
      await this.notifRepo.create({
        userId: input.directeurId,
        type: NotificationType.COMMANDE_EN_ATTENTE,
        message: `Nouvelle commande ${reference} — `
          + `${montantTTC.toLocaleString()} FCFA`,
        lien: `/commandes/${commande.id}`,
        commandeId: commande.id,
      });
    }

    return commande;
  }
}