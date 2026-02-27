import { AuditAction } from '../enums/audit-action.enum';

export class AuditLog {
  id!: string;
  userId!: string;
  action!: AuditAction;
  entite!: string;
  entiteId!: string;
  ancienneValeur?: object;
  nouvelleValeur?: object;
  createdAt!: Date;
}