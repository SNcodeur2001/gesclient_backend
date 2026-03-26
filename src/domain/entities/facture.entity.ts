import { FactureType } from '../enums/facture-type.enum';
import { FactureStatut } from '../enums/facture-statut.enum';

export class Facture {
  id!: string;
  numero!: string;
  type!: FactureType;
  commandeId!: string;
  montantHT!: number;
  tva!: number;
  montantTTC!: number;
  fichierBlob?: Buffer;
  fichierPath?: string;
  fichierUrl?: string;
  cloudinaryPublicId?: string;
  statut!: FactureStatut;
  envoyeeWhatsApp!: boolean;
  dateEnvoiWhatsApp?: Date;
  telephoneEnvoye?: string; // Numéro de téléphone du client envoyé
  downloadToken?: string; // Token de téléchargement usage unique
  downloadTokenExpiresAt?: Date; // Expiration du token
  genereParId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
