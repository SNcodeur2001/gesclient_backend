import { PaiementType } from '../enums/paiement-type.enum';
import { ModePaiement } from '../enums/mode-paiement.enum';

export class Paiement {
  id!: string;
  commandeId!: string;
  type!: PaiementType;
  montant!: number;
  modePaiement!: ModePaiement;
  valideParId!: string;
  createdAt!: Date;
}