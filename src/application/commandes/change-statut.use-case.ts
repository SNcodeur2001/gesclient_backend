import {
  Injectable, Inject,
} from '@nestjs/common';
import type { CommandeRepository } from '../../domain/ports/repositories/commande.repository';
import {
  COMMANDE_REPOSITORY,
} from '../../domain/ports/repositories/commande.repository';
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
import { CommandeStatut } from
  '../../domain/enums/commande-statut.enum';
import { AuditAction } from
  '../../domain/enums/audit-action.enum';
import { NotificationType } from
  '../../domain/enums/notification-type.enum';

@Injectable()
export class ChangeStatutUseCase {
  constructor(
    @Inject(COMMANDE_REPOSITORY)
    private readonly commandeRepo: CommandeRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifRepo: NotificationRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(
    commandeId: string,
    nouveauStatut: CommandeStatut,
    userId: string,
    directeurId?: string,
    commercialId?: string,
  ): Promise<Commande> {
    const raw = await this.commandeRepo.findById(commandeId);
    if (!raw) {
      throw new CommandeNotFoundException(commandeId);
    }

    // Instancier entité Domain → valider transition
    const commande = new Commande();
    Object.assign(commande, raw);

    // Lance CommandeStatutInvalideException si invalide
    commande.validerTransition(nouveauStatut);

    const commandeMaj = await this.commandeRepo.update(
      commandeId,
      { statut: nouveauStatut },
    );

    // Notifications
    if (nouveauStatut === CommandeStatut.PRETE) {
      const message =
        `Commande ${raw.reference} est prête pour livraison`;

      if (directeurId) {
        await this.notifRepo.create({
          userId: directeurId,
          type: NotificationType.COMMANDE_PRETE,
          message,
          commandeId,
          lien: `/commandes/${commandeId}`,
        });
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
      ancienneValeur: { statut: commande.statut },
      nouvelleValeur: { statut: nouveauStatut },
    });

    return commandeMaj;
  }
}