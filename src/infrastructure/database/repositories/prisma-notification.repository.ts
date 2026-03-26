import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationRepository } from '../../../domain/ports/repositories/notification.repository';
import { Notification } from '../../../domain/entities/notification.entity';
import { NotificationType } from '../../../domain/enums/notification-type.enum';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async withRetry<T>(
    label: string,
    fn: () => Promise<T>,
    attempts = 2,
  ): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        if (err?.code !== 'ETIMEDOUT' || i === attempts - 1) {
          throw err;
        }
        const delayMs = 200 + i * 200;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError;
  }

  async create(
    data: Omit<Notification, 'id' | 'createdAt' | 'lu'>,
  ): Promise<Notification> {
    const raw = await this.withRetry('createNotification', () =>
      this.prisma.notification.create({
        data,
      }),
    );
    return this.toDomain(raw);
  }

  async findAll(
    userId: string,
    lu?: boolean,
    page = 1,
    limit = 10,
  ): Promise<{ items: Notification[]; totalNonLues: number; total: number }> {
    const where: any = { userId };
    if (lu !== undefined) where.lu = lu;

    const skip = (page - 1) * limit;

    const [raws, totalNonLues, total] = await Promise.all([
      this.withRetry('findManyNotifications', () =>
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ),
      this.withRetry('countNotificationsNonLues', () =>
        this.prisma.notification.count({
          where: { userId, lu: false },
        }),
      ),
      this.withRetry('countNotifications', () =>
        this.prisma.notification.count({ where }),
      ),
    ]);

    return {
      items: raws.map(this.toDomain),
      totalNonLues,
      total,
    };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.withRetry('markNotificationAsRead', () =>
      this.prisma.notification.updateMany({
        where: { id, userId },
        data: { lu: true },
      }),
    );
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.withRetry('markAllNotificationsAsRead', () =>
      this.prisma.notification.updateMany({
        where: { userId, lu: false },
        data: { lu: true },
      }),
    );
    return result.count;
  }

  private toDomain(raw: any): Notification {
    const notif = new Notification();
    notif.id = raw.id;
    notif.userId = raw.userId;
    notif.type = raw.type as NotificationType;
    notif.message = raw.message;
    notif.lu = raw.lu;
    notif.lien = raw.lien;
    notif.clientId = raw.clientId;
    notif.commandeId = raw.commandeId;
    notif.createdAt = raw.createdAt;
    return notif;
  }
}
