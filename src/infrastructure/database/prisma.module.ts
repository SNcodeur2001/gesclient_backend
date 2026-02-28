import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaClientRepository } from './repositories/prisma-client.repository';
import { PrismaCollecteRepository } from './repositories/prisma-collecte.repository';
import { PrismaCommandeRepository } from './repositories/prisma-commande.repository';
import { PrismaPaiementRepository } from './repositories/prisma-paiement.repository';
import { PrismaNotificationRepository } from './repositories/prisma-notification.repository';
import { PrismaAuditLogRepository } from './repositories/prisma-audit-log.repository';
import { PrismaStatsRepository } from './repositories/prisma-stats.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaUserRepository,
    PrismaClientRepository,
    PrismaCollecteRepository,
    PrismaCommandeRepository,
    PrismaPaiementRepository,
    PrismaNotificationRepository,
    PrismaAuditLogRepository,
    PrismaStatsRepository,
  ],
  exports: [
    PrismaService,
    PrismaUserRepository,
    PrismaClientRepository,
    PrismaCollecteRepository,
    PrismaCommandeRepository,
    PrismaPaiementRepository,
    PrismaNotificationRepository,
    PrismaAuditLogRepository,
    PrismaStatsRepository,
  ],
})
export class PrismaModule {}
