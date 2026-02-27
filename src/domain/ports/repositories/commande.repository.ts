import { Commande } from '../../entities/commande.entity';
import { CommandeStatut } from '../../enums/commande-statut.enum';
import { CommandeType } from '../../enums/commande-type.enum';

export const COMMANDE_REPOSITORY = 'COMMANDE_REPOSITORY';

export interface CommandeRepository {
  findById(id: string): Promise<Commande | null>;
  findAll(filters: {
    commercialId?: string;
    statut?: CommandeStatut;
    type?: CommandeType;
    dateDebut?: Date;
    dateFin?: Date;
    page: number;
    limit: number;
  }): Promise<{
    items: Commande[];
    total: number;
    stats: {
      chiffreAffaires: number;
      commandesEnCours: number;
      enAttenteAcompte: number;
    };
  }>;
  create(
    data: Omit<Commande, 'id' | 'createdAt'>,
  ): Promise<Commande>;
  update(id: string, data: Partial<Commande>): Promise<Commande>;
  countAll(): Promise<number>;
}
