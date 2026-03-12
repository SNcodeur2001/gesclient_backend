import { Injectable, Inject } from '@nestjs/common';
import type { CommandeRepository } from '../../domain/ports/repositories/commande.repository';
import { COMMANDE_REPOSITORY } from '../../domain/ports/repositories/commande.repository';
import type { NotificationRepository } from '../../domain/ports/repositories/notification.repository';
import { NOTIFICATION_REPOSITORY } from '../../domain/ports/repositories/notification.repository';
import type { AuditLogRepository } from '../../domain/ports/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/ports/repositories/audit-log.repository';
import type { UserRepository } from '../../domain/ports/repositories/user.repository';
import { USER_REPOSITORY } from '../../domain/ports/repositories/user.repository';
import { Commande } from '../../domain/entities/commande.entity';
import { CommandeNotFoundException } from '../../domain/exceptions/commande-not-found.exception';
import { CommandeStatut } from '../../domain/enums/commande-statut.enum';
import { AuditAction } from '../../domain/enums/audit-action.enum';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { WhatsAppService } from '../../infrastructure/services/whatsapp.service';
import { ConfigService } from '@nestjs/config';

export interface ChangeStatutOutput {
  id: string;
  reference: string;
  type: import('../../domain/enums/commande-type.enum').CommandeType;
  statut: CommandeStatut;
  acheteurId: string;
  produit: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
  tva: number;
  montantTTC: number;
  acompteMinimum: number | null;
  acompteVerse: number;
  commercialId: string;
  createdAt: Date;
  waMeLink?: string;
}

@Injectable()
export class ChangeStatutUseCase {
  constructor(
    @Inject(COMMANDE_REPOSITORY)
    private readonly commandeRepo: CommandeRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifRepo: NotificationRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    private readonly whatsappService: WhatsAppService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    commandeId: string,
    nouveauStatut: CommandeStatut,
    userId: string,
    directeurId?: string,
    commercialId?: string,
  ): Promise<ChangeStatutOutput> {
    const raw = await this.commandeRepo.findById(commandeId);
    if (!raw) {
      throw new CommandeNotFoundException(commandeId);
    }

    // Instancier entité Domain → valider transition
    const commande = new Commande();
    Object.assign(commande, raw);

    // Lance CommandeStatutInvalideException si invalide
    commande.validerTransition(nouveauStatut);

    const commandeMaj = await this.commandeRepo.update(commandeId, {
      statut: nouveauStatut,
    });

    // Générer le lien WhatsApp quand passage à PRETE
    let waMeLink: string | undefined;

    if (nouveauStatut === CommandeStatut.PRETE) {
      // Récupérer le client pour avoir son téléphone
      const client = (raw as any).acheteer;
      const clientTelephone = client?.telephone;

      // Message de notification
      const message = `Bonjour ${client?.nom || 'Client'},\n\nVotre commande ${raw.reference} est prête !\n\nMerci de passer la récupérer.\n\nPROPLAST`;

      if (clientTelephone) {
        try {
          waMeLink = this.whatsappService.generateWhatsAppLink(
            clientTelephone,
            message,
          );
        } catch (error) {
          console.error('Erreur génération lien WhatsApp:', error);
        }
      }
    }

    // Notifications
    if (nouveauStatut === CommandeStatut.PRETE) {
      const message = `Commande ${raw.reference} est prête pour livraison`;

      // Notification au directeur - recherche automatique
      try {
        const directeur = await this.userRepo.findDirecteur();
        if (directeur) {
          await this.notifRepo.create({
            userId: directeur.id,
            type: NotificationType.COMMANDE_PRETE,
            message,
            commandeId,
            lien: `/commandes/${commandeId}`,
          });
        }
      } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
      }

      if (commercialId) {
        await this.notifRepo.create({
          userId: commercialId,
          type: NotificationType.COMMANDE_PRETE,
          message,
          commandeId,
          lien: `/commandes/${commandeId}`,
        });
      }
    }

    await this.auditRepo.log({
      userId,
      action: AuditAction.UPDATE,
      entite: 'Commande',
      entiteId: commandeId,
      description: `Commande ${raw.reference} passée au statut ${nouveauStatut}`,
      ancienneValeur: { statut: commande.statut },
      nouvelleValeur: { statut: nouveauStatut },
    });

    return {
      ...commandeMaj,
      waMeLink,
    };
  }
}
