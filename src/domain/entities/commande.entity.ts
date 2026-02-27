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

  static calculerTVA(
    montantHT: number,
    type: CommandeType,
  ): number {
    return type === CommandeType.A_DISTANCE
      ? montantHT * 0.20
      : 0;
  }

  static calculerAcompteMinimum(
    montantTTC: number,
    type: CommandeType,
  ): number | null {
    return type === CommandeType.A_DISTANCE
      ? montantTTC * 0.50
      : null;
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

validerTransition(nouveauStatut: CommandeStatut): void {
  const transitions: Partial<Record<CommandeStatut, CommandeStatut[]>> = {
    [CommandeStatut.EN_PREPARATION]: [CommandeStatut.PRETE],
  };

  const autorisees = transitions[this.statut] ?? [];
  if (!autorisees.includes(nouveauStatut)) {
    throw new CommandeStatutInvalideException(
      this.statut,
      nouveauStatut,
    );
  }
}

}