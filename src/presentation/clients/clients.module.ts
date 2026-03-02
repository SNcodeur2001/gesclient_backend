import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';

import { GetClientsUseCase } from
  '../../application/clients/get-clients.use-case';
import { GetClientByIdUseCase } from
  '../../application/clients/get-client-by-id.use-case';
import { CreateClientUseCase } from
  '../../application/clients/create-client.use-case';
import { UpdateClientUseCase } from
  '../../application/clients/update-client.use-case';
import { DeleteClientUseCase } from
  '../../application/clients/delete-client.use-case';
import { ImportClientsUseCase } from
  '../../application/clients/import-clients.use-case';
import { ExportClientsUseCase } from
  '../../application/clients/export-clients.use-case';
import { ExportClientsExcelUseCase } from
  '../../application/clients/export-clients-excel.use-case';
import { ExportClientsTemplateUseCase } from
  '../../application/clients/export-clients-template.use-case';

import { PrismaClientRepository } from
  '../../infrastructure/database/repositories/prisma-client.repository';
import { PrismaNotificationRepository } from
  '../../infrastructure/database/repositories/prisma-notification.repository';
import { PrismaAuditLogRepository } from
  '../../infrastructure/database/repositories/prisma-audit-log.repository';

import { CLIENT_REPOSITORY } from
  '../../domain/ports/repositories/client.repository';
import { NOTIFICATION_REPOSITORY } from
  '../../domain/ports/repositories/notification.repository';
import { AUDIT_LOG_REPOSITORY } from
  '../../domain/ports/repositories/audit-log.repository';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ClientsController],
  providers: [
    // Use Cases
    GetClientsUseCase,
    GetClientByIdUseCase,
    CreateClientUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
    ImportClientsUseCase,
    ExportClientsUseCase,
    ExportClientsExcelUseCase,
    ExportClientsTemplateUseCase,

    // Bindings
    { provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository },
    { provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository },
    { provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository },
  ],
})
export class ClientsModule {}