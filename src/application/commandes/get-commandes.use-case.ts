import { Injectable, Inject } from '@nestjs/common';
import type { CommandeRepository } from '../../domain/ports/repositories/commande.repository';
import { COMMANDE_REPOSITORY } from '../../domain/ports/repositories/commande.repository';
import { Role } from '../../domain/enums/role.enum';
import { CommandeStatut } from '../../domain/enums/commande-statut.enum';
import { CommandeType } from '../../domain/enums/commande-type.enum';

export interface GetCommandesInput {
  page: number;
  limit: number;
  search?: string;
  statut?: CommandeStatut;
  type?: CommandeType;
  dateDebut?: Date;
  dateFin?: Date;
}

@Injectable()
export class GetCommandesUseCase {
  constructor(
    @Inject(COMMANDE_REPOSITORY)
    private readonly commandeRepo: CommandeRepository,
  ) {}

  async execute(filters: GetCommandesInput, userRole: Role, userId: string) {
    const commercialId = userRole === Role.COMMERCIAL ? userId : undefined;

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
