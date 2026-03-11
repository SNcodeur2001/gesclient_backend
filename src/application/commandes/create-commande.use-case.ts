import { Injectable, Inject } from '@nestjs/common';
import type { CommandeRepository } from '../../domain/ports/repositories/commande.repository';
import {
  COMMANDE_REPOSITORY,
  CreateCommandeData,
} from '../../domain/ports/repositories/commande.repository';
import type { ClientRepository } from '../../domain/ports/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../domain/ports/repositories/client.repository';
import type { NotificationRepository } from '../../domain/ports/repositories/notification.repository';
import { NOTIFICATION_REPOSITORY } from '../../domain/ports/repositories/notification.repository';
import type { AuditLogRepository } from '../../domain/ports/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/ports/repositories/audit-log.repository';
import type { UserRepository } from '../../domain/ports/repositories/user.repository';
import { USER_REPOSITORY } from '../../domain/ports/repositories/user.repository';
import { Commande } from '../../domain/entities/commande.entity';
import { CommandeType } from '../../domain/enums/commande-type.enum';
import { CommandeStatut } from '../../domain/enums/commande-statut.enum';
import { ClientType } from '../../domain/enums/client-type.enum';
import { ClientStatut } from '../../domain/enums/client-statut.enum';
import { AuditAction } from '../../domain/enums/audit-action.enum';
import { NotificationType } from '../../domain/enums/notification-type.enum';

/**
 * Input DTO pour un item de commande
 */
export interface CommandeItemInput {
  produit: string;
  quantite: number;
  prixUnitaire: number;
}

export interface CreateCommandeInput {
  type: CommandeType;
  acheteurId?: string;
  acheteurInfo?: { nom: string; email?: string; telephone?: string };
  // Ancien système - un seul produit
  produit?: string;
  quantite?: number;
  prixUnitaire?: number;
  // Nouveau système - plusieurs produits
  items?: CommandeItemInput[];
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
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
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

    // 2. Déterminer les produits (nouveau système ou ancien)
    let items: CommandeItemInput[] = [];
    let produit: string | undefined;
    let quantite: number | undefined;
    let prixUnitaire: number | undefined;

    if (input.items && input.items.length > 0) {
      // Nouveau système: plusieurs produits
      items = input.items;
    } else if (
      input.produit &&
      input.quantite !== undefined &&
      input.prixUnitaire !== undefined
    ) {
      // Ancien système: un seul produit (backward compatibility)
      produit = input.produit;
      quantite = input.quantite;
      prixUnitaire = input.prixUnitaire;
      items = [{ produit, quantite, prixUnitaire }];
    } else {
      throw new Error(
        'Veuillez fournir soit un produit (produit, quantite, prixUnitaire) soit une liste de produits (items)',
      );
    }

    // 3. Calculs métier
    let montantHT = 0;
    for (const item of items) {
      montantHT += item.quantite * item.prixUnitaire;
    }

    const tva = Commande.calculerTVA(montantHT, input.type);
    const montantTTC = montantHT + tva;
    const acompteMinimum = Commande.calculerAcompteMinimum(
      montantTTC,
      input.type,
    );

    // 4. Statut initial - EN_PREPARATION car acompte requis pour A_DISTANCE
    const statut = CommandeStatut.EN_PREPARATION;
    const acompteVerse = 0;
    const soldeRestant = montantTTC;

    // 5. Générer référence unique CMD-YYYY-XXXX
    const count = await this.commandeRepo.countAll();
    const year = new Date().getFullYear();
    const reference = `CMD-${year}-${String(count + 1).padStart(4, '0')}`;

    // 6. Persister la commande avec les items
    const createData: CreateCommandeData = {
      reference,
      type: input.type,
      statut,
      acheteurId: acheteurId!,
      produit: items.length === 1 ? items[0].produit : undefined,
      quantite: items.length === 1 ? items[0].quantite : undefined,
      prixUnitaire: items.length === 1 ? items[0].prixUnitaire : undefined,
      montantHT,
      tva,
      montantTTC,
      acompteMinimum,
      acompteVerse,
      soldeRestant,
      commercialId: input.commercialId,
      // Les items seront créés via une relation
      items: items.map((item) => ({
        produit: item.produit,
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire,
      })),
    };
    const commande = await this.commandeRepo.create(createData);

    // 7. Le revenue client sera mis à jour lors de la réception du paiement
    // (voir add-paiement.use-case.ts)

    // 8. Audit + notification
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
        itemsCount: items.length,
      },
    });

    // Notification au directeur - recherche automatique
    try {
      const directeur = await this.userRepo.findDirecteur();
      if (directeur) {
        await this.notifRepo.create({
          userId: directeur.id,
          type: NotificationType.COMMANDE_EN_ATTENTE,
          message:
            `Nouvelle commande ${reference} — ` +
            `${montantTTC.toLocaleString()} FCFA (${items.length} produit(s))`,
          lien: `/commandes/${commande.id}`,
          commandeId: commande.id,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
    }

    return commande;
  }
}
