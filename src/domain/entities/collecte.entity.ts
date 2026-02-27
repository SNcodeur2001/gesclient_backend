export class Collecte {
  id!: string;
  apporteurId!: string;
  quantiteKg!: number;
  prixUnitaire!: number;
  montantTotal!: number;
  notes?: string;
  collecteurId!: string;
  createdAt!: Date;

  static calculerMontant(
    quantiteKg: number,
    prixUnitaire: number,
  ): number {
    return quantiteKg * prixUnitaire;
  }
}