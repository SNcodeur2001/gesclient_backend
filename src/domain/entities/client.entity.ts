import { ClientType } from '../enums/client-type.enum';
import { ClientStatut } from '../enums/client-statut.enum';

export class Client {
  id!: string;
  nom!: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  type!: ClientType;
  statut!: ClientStatut;
  totalRevenue!: number;
  notes?: string;
  assignedUserId?: string;
  createdAt!: Date;
  deletedAt?: Date;
}