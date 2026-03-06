import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandeRepository,
  COMMANDE_REPOSITORY,
} from '../../domain/ports/repositories/commande.repository';
import type { CommandeRepository as CommandeRepositoryType } from '../../domain/ports/repositories/commande.repository';
import { Commande } from '../../domain/entities/commande.entity';
import { Role } from '../../domain/enums/role.enum';

@Injectable()
export class GetCommandeByIdUseCase {
  constructor(
    @Inject(COMMANDE_REPOSITORY)
    private readonly commandeRepo: CommandeRepositoryType,
  ) {}

  async execute(
    id: string,
    userRole: Role,
    userId: string,
  ): Promise<Commande> {
    const commande = await this.commandeRepo.findById(id);
    if (!commande) throw new NotFoundException(`Commande ${id} non trouvée`);

    // Vérifier le périmètre: un commercial ne voit que ses propres commandes
    if (userRole === Role.COMMERCIAL && commande.commercialId !== userId) {
      throw new ForbiddenException(
        'Accès refusé à cette commande',
      );
    }

    return commande;
  }
}
