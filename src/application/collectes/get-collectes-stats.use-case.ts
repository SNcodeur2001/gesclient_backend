import { Injectable, Inject } from '@nestjs/common';
import type { CollecteRepository } from '../../domain/ports/repositories/collecte.repository';
import {
  COLLECTE_REPOSITORY,
} from '../../domain/ports/repositories/collecte.repository';

@Injectable()
export class GetCollectesStatsUseCase {
  constructor(
    @Inject(COLLECTE_REPOSITORY)
    private readonly collecteRepo: CollecteRepository,
  ) {}

  async execute() {
    return this.collecteRepo.getStats();
  }
}