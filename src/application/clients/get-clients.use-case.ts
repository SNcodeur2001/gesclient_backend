import { Injectable, Inject } from '@nestjs/common';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
} from '../../domain/ports/repositories/client.repository';
import type { ClientRepository as ClientRepositoryType } from '../../domain/ports/repositories/client.repository';
import { ClientType } from '../../domain/enums/client-type.enum';
import { ClientStatut } from '../../domain/enums/client-statut.enum';
import { Role } from '../../domain/enums/role.enum';
import { Client } from '../../domain/entities/client.entity';

export interface GetClientsInput {
  page: number;
  limit: number;
  search?: string;
  type?: ClientType;
  statut?: ClientStatut;
  userRole: Role;
}

@Injectable()
export class GetClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryType,
  ) {}

  async execute(input: GetClientsInput): Promise<{
    items: Client[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Forcer le type selon le rôle
    let type = input.type;
    if (input.userRole === Role.COMMERCIAL) {
      type = ClientType.ACHETEUR;
    } else if (input.userRole === Role.COLLECTEUR) {
      type = ClientType.APPORTEUR;
    }

    const result = await this.clientRepo.findAll({
      page: input.page,
      limit: input.limit,
      search: input.search,
      type,
      statut: input.statut,
    });

    return {
      ...result,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(result.total / input.limit),
    };
  }
}
