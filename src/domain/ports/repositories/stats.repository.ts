export const STATS_REPOSITORY = 'STATS_REPOSITORY';

export interface StatsRepository {
  getDashboard(): Promise<{
    collecte: {
      tonnageMois: number;
      montantMois: number;
      variationMois: string;
    };
    commercial: {
      chiffreAffairesMois: number;
      commandesEnCours: number;
      enAttenteAcompte: number;
      variationMois: string;
    };
    clients: {
      totalApporteurs: number;
      totalAcheteurs: number;
      nouveauxCeMois: number;
    };
    topApporteurs: {
      id: string;
      nom: string;
      tonnage: number;
      montant: number;
    }[];
    topAcheteurs: {
      id: string;
      nom: string;
      chiffreAffaires: number;
    }[];
    evolutionCollecte: { mois: string; tonnage: number }[];
    evolutionCA: { mois: string; montant: number }[];
  }>;
}
