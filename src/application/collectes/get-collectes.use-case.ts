import { Injectable, Inject } from '@nestjs/common';
import type { CollecteRepository } from '../../domain/ports/repositories/collecte.repository';
import {
  COLLECTE_REPOSITORY,
} from '../../domain/ports/repositories/collecte.repository';
import { Role } from '../../domain/enums/role.enum';

@Injectable()
export class GetCollectesUseCase {
  constructor(
    @Inject(COLLECTE_REPOSITORY)
    private readonly collecteRepo: CollecteRepository,
  ) {}

  async execute(
    filters: {
      apporteurId?: string;
      dateDebut?: Date;
      dateFin?: Date;
      page: number;
      limit: number;
    },
    userRole: Role,
    userId: string,
  ) {
    // Collecteur ne voit que ses propres collectes
    const collecteurId =
      userRole === Role.COLLECTEUR ? userId : undefined;

    const result = await this.collecteRepo.findAll({
      ...filters,
      collecteurId,
    });

    return {
      ...result,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(result.total / filters.limit),
    };
  }
}