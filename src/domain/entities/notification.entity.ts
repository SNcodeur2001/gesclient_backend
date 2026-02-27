import { NotificationType } from
  '../enums/notification-type.enum';

export class Notification {
  id!: string;
  userId!: string;
  type!: NotificationType;
  message!: string;
  lu!: boolean;
  lien?: string;
  clientId?: string;
  commandeId?: string;
  createdAt!: Date;
}