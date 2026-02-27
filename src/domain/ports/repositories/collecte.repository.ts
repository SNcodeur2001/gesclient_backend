import { Collecte } from '../../entities/collecte.entity';

export const COLLECTE_REPOSITORY = 'COLLECTE_REPOSITORY';

export interface CollecteRepository {
  create(
    data: Omit<Collecte, 'id' | 'createdAt'>,
  ): Promise<Collecte>;
  findAll(filters: {
    collecteurId?: string;
    apporteurId?: string;
    dateDebut?: Date;
    dateFin?: Date;
    page: number;
    limit: number;
  }): Promise<{
    items: Collecte[];
    total: number;
    tonnageTotal: number;
    montantTotal: number;
  }>;
  getStats(): Promise<{
    tonnageTotalMois: number;
    montantTotalMois: number;
    nombreCollectes: number;
    topApporteurs: {
      id: string;
      nom: string;
      tonnage: number;
      montant: number;
    }[];
    evolutionMensuelle: {
      mois: string;
      tonnage: number;
    }[];
  }>;
}
