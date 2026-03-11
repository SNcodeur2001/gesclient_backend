export class Collecte {
  id!: string;
  apporteurId!: string;
  quantiteKg!: number | null;
  prixUnitaire!: number | null;
  montantTotal!: number;
  notes?: string;
  collecteurId!: string;
  createdAt!: Date;
  // Relations enrichies
  items?: CollecteItem[];
}

export class CollecteItem {
  id!: string;
  collecteId!: string;
  typePlastique!: string;
  quantiteKg!: number;
  prixUnitaire!: number;
  createdAt!: Date;
}

export function calculerMontantCollecte(
  items: { quantiteKg: number; prixUnitaire: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + item.quantiteKg * item.prixUnitaire,
    0,
  );
}
