export class CollecteItem {
  id!: string;
  collecteId!: string;
  typePlastique!: string;
  quantiteKg!: number;
  prixUnitaire!: number;
  createdAt!: Date;

  /**
   * Calcule le sous-total pour cet item
   */
  get montant(): number {
    return this.quantiteKg * this.prixUnitaire;
  }
}
