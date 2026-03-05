import { Injectable, Inject } from '@nestjs/common';
import type { StatsRepository } from '../../domain/ports/repositories/stats.repository';
import { STATS_REPOSITORY } from '../../domain/ports/repositories/stats.repository';

@Injectable()
export class GetDashboardUseCase {
  constructor(
    @Inject(STATS_REPOSITORY)
    private readonly statsRepo: StatsRepository,
  ) {}

  async execute() {
    const dashboard = await this.statsRepo.getDashboard();
    return dashboard;
  }
}
