import { Module } from '@nestjs/common';
import { CollectesController } from
  './collectes.controller';

import { CreateCollecteUseCase } from
  '../../application/collectes/create-collecte.use-case';
import { GetCollectesUseCase } from
  '../../application/collectes/get-collectes.use-case';
import { GetCollectesStatsUseCase } from
  '../../application/collectes/get-collectes-stats.use-case';

import { PrismaCollecteRepository } from
  '../../infrastructure/database/repositories/prisma-collecte.repository';
import { PrismaClientRepository } from
  '../../infrastructure/database/repositories/prisma-client.repository';
import { PrismaNotificationRepository } from
  '../../infrastructure/database/repositories/prisma-notification.repository';
import { PrismaAuditLogRepository } from
  '../../infrastructure/database/repositories/prisma-audit-log.repository';

import { COLLECTE_REPOSITORY } from
  '../../domain/ports/repositories/collecte.repository';
import { CLIENT_REPOSITORY } from
  '../../domain/ports/repositories/client.repository';
import { NOTIFICATION_REPOSITORY } from
  '../../domain/ports/repositories/notification.repository';
import { AUDIT_LOG_REPOSITORY } from
  '../../domain/ports/repositories/audit-log.repository';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CollectesController],
  providers: [
    CreateCollecteUseCase,
    GetCollectesUseCase,
    GetCollectesStatsUseCase,
    { provide: COLLECTE_REPOSITORY,
      useClass: PrismaCollecteRepository },
    { provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository },
    { provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository },
    { provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository },
  ],
})
export class CollectesModule {}