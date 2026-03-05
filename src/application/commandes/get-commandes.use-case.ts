import { Injectable, Inject } from '@nestjs/common';
import type { CommandeRepository } from '../../domain/ports/repositories/commande.repository';
import {
  COMMANDE_REPOSITORY,
} from '../../domain/ports/repositories/commande.repository';
import { Role } from '../../domain/enums/role.enum';
import { CommandeStatut } from
  '../../domain/enums/commande-statut.enum';
import { CommandeType } from
  '../../domain/enums/commande-type.enum';

@Injectable()
export class GetCommandesUseCase {
  constructor(
    @Inject(COMMANDE_REPOSITORY)
    private readonly commandeRepo: CommandeRepository,
  ) {}

  async execute(
    filters: {
      statut?: CommandeStatut;
      type?: CommandeType;
      dateDebut?: Date;
      dateFin?: Date;
      page: number;
      limit: number;
    },
    userRole: Role,
    userId: string,
  ) {
    const commercialId =
      userRole === Role.COMMERCIAL ? userId : undefined;

    const result = await this.commandeRepo.findAll({
      ...filters,
      commercialId,
    });

    return {
      ...result,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(result.total / filters.limit),
    };
  }
}