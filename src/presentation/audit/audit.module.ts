import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';

import { GetAuditLogsUseCase } from '../../application/audit/get-audit-logs.use-case';

import { PrismaAuditLogRepository } from '../../infrastructure/database/repositories/prisma-audit-log.repository';

import { AUDIT_LOG_REPOSITORY } from '../../domain/ports/repositories/audit-log.repository';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [
    // Use Cases
    GetAuditLogsUseCase,

    // Bindings
    { provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository },
  ],
})
export class AuditModule {}
