import {
  Injectable, Inject, BadRequestException,
} from '@nestjs/common';
import type { CommandeRepository } from '../../domain/ports/repositories/commande.repository';
import {
  COMMANDE_REPOSITORY,
} from '../../domain/ports/repositories/commande.repository';
import type { PaiementRepository } from '../../domain/ports/repositories/paiement.repository';
import {
  PAIEMENT_REPOSITORY,
} from '../../domain/ports/repositories/paiement.repository';
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
import { CommandeNotFoundException } from
  '../../domain/exceptions/commande-not-found.exception';
import { PaiementType } from
  '../../domain/enums/paiement-type.enum';
import { ModePaiement } from
  '../../domain/enums/mode-paiement.enum';
import { CommandeStatut } from
  '../../domain/enums/commande-statut.enum';
import { AuditAction } from
  '../../domain/enums/audit-action.enum';
import { NotificationType } from
  '../../domain/enums/notification-type.enum';

export interface AddPaiementInput {
  commandeId: string;
  type: PaiementType;
  montant: number;
  modePaiement: ModePaiement;
  valideParId: string;
  directeurId?: string;
  commercialId?: string;
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
  ) {}

  async execute(input: AddPaiementInput) {
    // 1. Récupérer la commande
    const raw = await this.commandeRepo.findById(
      input.commandeId,
    );
    if (!raw) {
      throw new CommandeNotFoundException(input.commandeId);
    }

    // 2. Instancier entité Domain pour règles métier
    const commande = new Commande();
    Object.assign(commande, raw);

    let nouveauStatut: CommandeStatut;
    let nouveauAcompteVerse: number;
    let nouveauSoldeRestant: number;

    if (input.type === PaiementType.ACOMPTE) {
      // Vérifier statut
      if (commande.statut !== CommandeStatut.EN_ATTENTE_ACOMPTE) {
        throw new BadRequestException(
          'Commande non en attente d\'acompte',
        );
      }
      // Règle métier Domain → lance AcompteInsuffisantException
      commande.validerAcompte(input.montant);

      nouveauAcompteVerse = commande.acompteVerse + input.montant;
      nouveauSoldeRestant = commande.montantTTC - nouveauAcompteVerse;
      nouveauStatut = CommandeStatut.EN_PREPARATION;

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

      // Mettre à jour revenue client
      const acheteur = await this.clientRepo.findById(
        commande.acheteurId,
      );
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
    const commandeMaj = await this.commandeRepo.update(
      input.commandeId,
      {
        statut: nouveauStatut,
        acompteVerse: nouveauAcompteVerse,
        soldeRestant: nouveauSoldeRestant,
      },
    );

    // 5. Notifications
    const notifType = input.type === PaiementType.ACOMPTE
      ? NotificationType.ACOMPTE_RECU
      : NotificationType.COMMANDE_FINALISEE;

    const notifMessage = input.type === PaiementType.ACOMPTE
      ? `Acompte reçu : ${input.montant.toLocaleString()} FCFA — ${raw.reference}`
      : `Commande finalisée : ${raw.reference}`;

    if (input.directeurId) {
      await this.notifRepo.create({
        userId: input.directeurId,
        type: notifType,
        message: notifMessage,
        commandeId: input.commandeId,
        lien: `/commandes/${input.commandeId}`,
      });
    }
    if (input.commercialId &&
        input.commercialId !== input.valideParId) {
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
    };
  }
}