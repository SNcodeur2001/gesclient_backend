import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  CollecteRepository,
  COLLECTE_REPOSITORY,
} from '../../domain/ports/repositories/collecte.repository';
import type { CollecteRepository as CollecteRepositoryType } from '../../domain/ports/repositories/collecte.repository';
import { Collecte } from '../../domain/entities/collecte.entity';
import { Role } from '../../domain/enums/role.enum';

@Injectable()
export class GetCollecteByIdUseCase {
  constructor(
    @Inject(COLLECTE_REPOSITORY)
    private readonly collecteRepo: CollecteRepositoryType,
  ) {}

  async execute(
    id: string,
    userRole: Role,
    userId: string,
  ): Promise<Collecte> {
    const collecte = await this.collecteRepo.findById(id);
    if (!collecte) throw new NotFoundException(`Collecte ${id} non trouvée`);

    // Vérifier le périmètre: un collecteur ne voit que ses propres collectes
    if (userRole === Role.COLLECTEUR && collecte.collecteurId !== userId) {
      throw new ForbiddenException(
        'Accès refusé à cette collecte',
      );
    }

    return collecte;
  }
}
