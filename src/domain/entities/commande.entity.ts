import { CommandeType } from '../enums/commande-type.enum';
import { CommandeStatut } from '../enums/commande-statut.enum';
import { AcompteInsuffisantException } from '../exceptions/acompte-insuffisant.exception';
import { CommandeStatutInvalideException } from '../exceptions/commande-statut-invalide.exception';

export class Commande {
  id!: string;
  reference!: string;
  type!: CommandeType;
  statut!: CommandeStatut;
  acheteurId!: string;
  // Ancien système - un seul produit (conservé pour compatibilité)
  produit!: string;
  quantite!: number;
  prixUnitaire!: number;
  montantHT!: number;
  tva!: number;
  montantTTC!: number;
  acompteMinimum!: number | null;
  acompteVerse!: number;
  soldeRestant!: number;
  commercialId!: string;
  createdAt!: Date;

  // Nouveau système - plusieurs produits
  items?: Array<{
    id: string;
    produit: string;
    quantite: number;
    prixUnitaire: number;
  }>;

  /**
   * Calcule le montant HT total à partir des items
   */
  static calculerMontantHT(
    items: Array<{ quantite: number; prixUnitaire: number }>,
  ): number {
    return items.reduce(
      (sum, item) => sum + item.quantite * item.prixUnitaire,
      0,
    );
  }

  /**
   * Calcule la TVA selon le type de commande
   */
  static calculerTVA(montantHT: number, type: CommandeType): number {
    return type === CommandeType.A_DISTANCE ? montantHT * 0.2 : 0;
  }

  /**
   * Calcule le montant TTC
   */
  static calculerMontantTTC(montantHT: number, tva: number): number {
    return montantHT + tva;
  }

  /**
   * Calcule l'acompte minimum selon le type
   */
  static calculerAcompteMinimum(
    montantTTC: number,
    type: CommandeType,
  ): number | null {
    return type === CommandeType.A_DISTANCE ? montantTTC * 0.5 : null;
  }

  validerAcompte(montant: number): void {
    if (!this.acompteMinimum) return;
    if (montant < this.acompteMinimum) {
      throw new AcompteInsuffisantException(
        montant,
        this.acompteMinimum,
        this.montantTTC,
      );
    }
  }

  /**
   * Valide la transition de statut
   */
  validerTransition(nouveauStatut: CommandeStatut): void {
    // Exception métier: si tout est déjà payé, on peut finaliser directement
    if (
      this.statut === CommandeStatut.EN_PREPARATION &&
      nouveauStatut === CommandeStatut.FINALISEE &&
      this.soldeRestant === 0
    ) {
      return;
    }

    const transitions: Partial<Record<CommandeStatut, CommandeStatut[]>> = {
      [CommandeStatut.EN_PREPARATION]: [CommandeStatut.PRETE],
      [CommandeStatut.PRETE]: [CommandeStatut.FINALISEE],
    };

    const autorisees = transitions[this.statut] ?? [];
    if (!autorisees.includes(nouveauStatut)) {
      throw new CommandeStatutInvalideException(this.statut, nouveauStatut);
    }
  }
}
