import { Module } from '@nestjs/common';
import { CommandesController } from
  './commandes.controller';

import { CreateCommandeUseCase } from
  '../../application/commandes/create-commande.use-case';
import { AddPaiementUseCase } from
  '../../application/commandes/add-paiement.use-case';
import { ChangeStatutUseCase } from
  '../../application/commandes/change-statut.use-case';
import { GetCommandesUseCase } from
  '../../application/commandes/get-commandes.use-case';
import { GetCommandeByIdUseCase } from
  '../../application/commandes/get-commande-by-id.use-case';

import { PrismaCommandeRepository } from
  '../../infrastructure/database/repositories/prisma-commande.repository';
import { PrismaPaiementRepository } from
  '../../infrastructure/database/repositories/prisma-paiement.repository';
import { PrismaClientRepository } from
  '../../infrastructure/database/repositories/prisma-client.repository';
import { PrismaNotificationRepository } from
  '../../infrastructure/database/repositories/prisma-notification.repository';
import { PrismaAuditLogRepository } from
  '../../infrastructure/database/repositories/prisma-audit-log.repository';

import { COMMANDE_REPOSITORY } from
  '../../domain/ports/repositories/commande.repository';
import { PAIEMENT_REPOSITORY } from
  '../../domain/ports/repositories/paiement.repository';
import { CLIENT_REPOSITORY } from
  '../../domain/ports/repositories/client.repository';
import { NOTIFICATION_REPOSITORY } from
  '../../domain/ports/repositories/notification.repository';
import { AUDIT_LOG_REPOSITORY } from
  '../../domain/ports/repositories/audit-log.repository';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CommandesController],
  providers: [
    CreateCommandeUseCase,
    AddPaiementUseCase,
    ChangeStatutUseCase,
    GetCommandesUseCase,
    GetCommandeByIdUseCase,
    { provide: COMMANDE_REPOSITORY,
      useClass: PrismaCommandeRepository },
    { provide: PAIEMENT_REPOSITORY,
      useClass: PrismaPaiementRepository },
    { provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository },
    { provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository },
    { provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository },
  ],
})
export class CommandesModule {}