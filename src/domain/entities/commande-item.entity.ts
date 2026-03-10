export class CommandeItem {
  id!: string;
  commandeId!: string;
  produit!: string;
  quantite!: number;
  prixUnitaire!: number;
  createdAt!: Date;

  /**
   * Calcule le sous-total pour cet item (HT)
   */
  get montantHT(): number {
    return this.quantite * this.prixUnitaire;
  }
}
