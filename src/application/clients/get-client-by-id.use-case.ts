import {
  Injectable,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
} from '../../domain/ports/repositories/client.repository';
import type { ClientRepository as ClientRepositoryType } from '../../domain/ports/repositories/client.repository';
import { ClientNotFoundException } from
  '../../domain/exceptions/client-not-found.exception';
import { Role } from '../../domain/enums/role.enum';
import { ClientType } from
  '../../domain/enums/client-type.enum';
import { Client } from '../../domain/entities/client.entity';

@Injectable()
export class GetClientByIdUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryType,
  ) {}

  async execute(
    id: string,
    userRole: Role,
  ): Promise<Client> {
    const client = await this.clientRepo.findById(id);
    if (!client) throw new ClientNotFoundException(id);

    // Vérifier périmètre
    if (
      userRole === Role.COMMERCIAL &&
      client.type === ClientType.APPORTEUR
    ) {
      throw new ForbiddenException(
        'Accès refusé à ce client',
      );
    }
    if (
      userRole === Role.COLLECTEUR &&
      client.type === ClientType.ACHETEUR
    ) {
      throw new ForbiddenException(
        'Accès refusé à ce client',
      );
    }

    return client;
  }
}