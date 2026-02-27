import { Notification } from '../../entities/notification.entity';

export const NOTIFICATION_REPOSITORY = 'NOTIFICATION_REPOSITORY';

export interface NotificationRepository {
  create(
    data: Omit<Notification, 'id' | 'createdAt' | 'lu'>,
  ): Promise<Notification>;
  findAll(
    userId: string,
    lu?: boolean,
  ): Promise<{
    items: Notification[];
    totalNonLues: number;
  }>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<number>;
}
