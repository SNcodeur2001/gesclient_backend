import { Role } from '../enums/role.enum';

export class User {
  id!: string;
  nom!: string;
  prenom!: string;
  email!: string;
  password!: string;
  role!: Role;
  actif!: boolean;
  createdAt!: Date;
}