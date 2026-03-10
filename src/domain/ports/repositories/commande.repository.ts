import { Commande } from '../../entities/commande.entity';
import { CommandeStatut } from '../../enums/commande-statut.enum';
import { CommandeType } from '../../enums/commande-type.enum';

export const COMMANDE_REPOSITORY = 'COMMANDE_REPOSITORY';

export interface CreateCommandeData {
  reference: string;
  type: CommandeType;
  statut: CommandeStatut;
  acheteurId: string;
  produit?: string | null;
  quantite?: number | null;
  prixUnitaire?: number | null;
  montantHT: number;
  tva: number;
  montantTTC: number;
  acompteMinimum: number | null;
  acompteVerse: number;
  soldeRestant: number;
  commercialId: string;
  // Nouveau système - plusieurs produits
  items?: {
    produit: string;
    quantite: number;
    prixUnitaire: number;
  }[];
}

export interface UpdateCommandeData {
  statut?: CommandeStatut;
  montantHT?: number;
  tva?: number;
  montantTTC?: number;
  acompteMinimum?: number | null;
  acompteVerse?: number;
  soldeRestant?: number;
}

export interface CommandeRepository {
  findById(id: string): Promise<Commande | null>;
  findAll(filters: {
    search?: string;
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
    data: CreateCommandeData,
  ): Promise<Commande>;
  update(id: string, data: UpdateCommandeData): Promise<Commande>;
  countAll(): Promise<number>;
}
