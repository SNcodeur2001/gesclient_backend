import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';

import { GetDashboardUseCase } from '../../application/stats/get-dashboard.use-case';
import { PrismaStatsRepository } from '../../infrastructure/database/repositories/prisma-stats.repository';

import { STATS_REPOSITORY } from '../../domain/ports/repositories/stats.repository';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StatsController],
  providers: [
    GetDashboardUseCase,
    { provide: STATS_REPOSITORY, useClass: PrismaStatsRepository },
  ],
})
export class StatsModule {}
