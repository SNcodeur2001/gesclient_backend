import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { CommandeRepository } from '../../domain/ports/repositories/commande.repository';
import { COMMANDE_REPOSITORY } from '../../domain/ports/repositories/commande.repository';
import type { PaiementRepository } from '../../domain/ports/repositories/paiement.repository';
import { PAIEMENT_REPOSITORY } from '../../domain/ports/repositories/paiement.repository';
import type { ClientRepository } from '../../domain/ports/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../domain/ports/repositories/client.repository';
import type { NotificationRepository } from '../../domain/ports/repositories/notification.repository';
import { NOTIFICATION_REPOSITORY } from '../../domain/ports/repositories/notification.repository';
import type { AuditLogRepository } from '../../domain/ports/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/ports/repositories/audit-log.repository';
import type { UserRepository } from '../../domain/ports/repositories/user.repository';
import { USER_REPOSITORY } from '../../domain/ports/repositories/user.repository';
import { Commande } from '../../domain/entities/commande.entity';
import { CommandeNotFoundException } from '../../domain/exceptions/commande-not-found.exception';
import { PaiementType } from '../../domain/enums/paiement-type.enum';
import { ModePaiement } from '../../domain/enums/mode-paiement.enum';
import { CommandeStatut } from '../../domain/enums/commande-statut.enum';
import { CommandeType } from '../../domain/enums/commande-type.enum';
import { FactureType } from '../../domain/enums/facture-type.enum';
import { AuditAction } from '../../domain/enums/audit-action.enum';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { GenerateFactureUseCase } from '../factures/generate-facture.use-case';

export interface AddPaiementInput {
  commandeId: string;
  type: PaiementType;
  montant: number;
  modePaiement: ModePaiement;
  valideParId: string;
  directeurId?: string;
  commercialId?: string;
}

export interface AddPaiementOutput {
  paiementId: string;
  montant: number;
  acompteVerse: number;
  soldeRestant: number;
  statut: CommandeStatut;
  facturesGenerees?: {
    proforma?: { id: string; numero: string };
    definitive?: { id: string; numero: string };
  };
}

@Injectable()
export class AddPaiementUseCase {
  constructor(
    @Inject(COMMANDE_REPOSITORY)
    private readonly commandeRepo: CommandeRepository,
    @Inject(PAIEMENT_REPOSITORY)
    private readonly paiementRepo: PaiementRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifRepo: NotificationRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    private readonly generateFactureUseCase: GenerateFactureUseCase,
  ) {}

  async execute(input: AddPaiementInput): Promise<AddPaiementOutput> {
    // 1. Récupérer la commande
    const raw = await this.commandeRepo.findById(input.commandeId);
    if (!raw) {
      throw new CommandeNotFoundException(input.commandeId);
    }

    // 2. Instancier entité Domain pour règles métier
    const commande = new Commande();
    Object.assign(commande, raw);

    let nouveauStatut: CommandeStatut;
    let nouveauAcompteVerse: number;
    let nouveauSoldeRestant: number;
    let facturesGenerees: AddPaiementOutput['facturesGenerees'] = undefined;

    if (input.type === PaiementType.ACOMPTE) {
      // Vérifier statut - doit être en préparation
      if (commande.statut !== CommandeStatut.EN_PREPARATION) {
        throw new BadRequestException("Commande non en attente d'acompte");
      }
      // Règle métier Domain → lance AcompteInsuffisantException
      commande.validerAcompte(input.montant);

      nouveauAcompteVerse = commande.acompteVerse + input.montant;
      nouveauSoldeRestant = commande.montantTTC - nouveauAcompteVerse;
      nouveauStatut = CommandeStatut.EN_PREPARATION;

      // Générer automatique de la facture selon le tableau
      // | Moment | Type de facture générée |
      // |--------|------------------------|
      // | SUR_PLACE paiement | **Définitif** |
      // | A_DISTANCE acompt 50-99% | **Proforma** |
      // | A_DISTANCE acompt 100% | **Définitif** (pas de proforma car déjà tout payé) |
      const isSurPlace = commande.type === CommandeType.SUR_PLACE;
      const isPaiementComplet = nouveauAcompteVerse >= commande.montantTTC;

      try {
        if (isSurPlace || isPaiementComplet) {
          // SUR_PLACE ou A_DISTANCE 100% → Définitif seulement
          const result = await this.generateFactureUseCase.execute({
            commandeId: input.commandeId,
            type: FactureType.DEFINITIVE,
            genereParId: input.valideParId,
          });
          facturesGenerees = {
            definitive: {
              id: result.facture.id,
              numero: result.facture.numero,
            },
          };
        } else {
          // A_DISTANCE + acompt < 100% → Proforma
          const result = await this.generateFactureUseCase.execute({
            commandeId: input.commandeId,
            type: FactureType.PROFORMA,
            genereParId: input.valideParId,
          });
          facturesGenerees = {
            proforma: { id: result.facture.id, numero: result.facture.numero },
          };
        }
      } catch (error) {
        // Log error but don't fail the payment
        console.error('Erreur génération facture automatique:', error);
      }
    } else {
      // SOLDE
      if (commande.statut !== CommandeStatut.PRETE) {
        throw new BadRequestException(
          'La commande doit être PRETE pour enregistrer le solde',
        );
      }
      if (input.montant !== commande.soldeRestant) {
        throw new BadRequestException(
          `Montant incorrect. Solde restant : ${commande.soldeRestant} FCFA`,
        );
      }
      nouveauAcompteVerse = commande.acompteVerse + input.montant;
      nouveauSoldeRestant = 0;
      nouveauStatut = CommandeStatut.FINALISEE;

      // Paiement solde (A_DISTANCE) → Définitif
      // On génère une nouvelle définitive (ou on met à jour l'existante)
      try {
        const result = await this.generateFactureUseCase.execute({
          commandeId: input.commandeId,
          type: FactureType.DEFINITIVE,
          genereParId: input.valideParId,
        });
        facturesGenerees = {
          definitive: { id: result.facture.id, numero: result.facture.numero },
        };
      } catch (error) {
        // Log error but don't fail the payment
        console.error('Erreur génération facture automatique:', error);
      }

      // Mettre à jour revenue client
      const acheteur = await this.clientRepo.findById(commande.acheteurId);
      if (acheteur) {
        await this.clientRepo.update(commande.acheteurId, {
          totalRevenue: acheteur.totalRevenue + commande.montantTTC,
        });
      }
    }

    // 3. Créer le paiement
    await this.paiementRepo.create({
      commandeId: input.commandeId,
      type: input.type,
      montant: input.montant,
      modePaiement: input.modePaiement,
      valideParId: input.valideParId,
    });

    // 4. Mettre à jour la commande
    const commandeMaj = await this.commandeRepo.update(input.commandeId, {
      statut: nouveauStatut,
      acompteVerse: nouveauAcompteVerse,
      soldeRestant: nouveauSoldeRestant,
    });

    // 5. Notifications
    const notifType =
      input.type === PaiementType.ACOMPTE
        ? NotificationType.ACOMPTE_RECU
        : NotificationType.COMMANDE_FINALISEE;

    const notifMessage =
      input.type === PaiementType.ACOMPTE
        ? `Acompte reçu : ${input.montant.toLocaleString()} FCFA — ${raw.reference}`
        : `Commande finalisée : ${raw.reference}`;

    // Notification au directeur - recherche automatique
    try {
      const directeur = await this.userRepo.findDirecteur();
      if (directeur) {
        await this.notifRepo.create({
          userId: directeur.id,
          type: notifType,
          message: notifMessage,
          commandeId: input.commandeId,
          lien: `/commandes/${input.commandeId}`,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
    }

    if (input.commercialId && input.commercialId !== input.valideParId) {
      await this.notifRepo.create({
        userId: input.commercialId,
        type: notifType,
        message: notifMessage,
        commandeId: input.commandeId,
        lien: `/commandes/${input.commandeId}`,
      });
    }

    // 6. Audit
    await this.auditRepo.log({
      userId: input.valideParId,
      action: AuditAction.UPDATE,
      entite: 'Commande',
      entiteId: input.commandeId,
      description: `Paiement de ${input.montant.toLocaleString()} FCFA (${input.type}) reçu pour commande ${raw.reference}`,
      ancienneValeur: { statut: commande.statut },
      nouvelleValeur: {
        statut: nouveauStatut,
        paiement: input.montant,
        type: input.type,
      },
    });

    return {
      paiementId: input.commandeId,
      montant: input.montant,
      acompteVerse: nouveauAcompteVerse,
      soldeRestant: nouveauSoldeRestant,
      statut: nouveauStatut,
      facturesGenerees,
    };
  }
}
