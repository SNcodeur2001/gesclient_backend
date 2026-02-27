import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationRepository } from '../../../domain/ports/repositories/notification.repository';
import { Notification } from '../../../domain/entities/notification.entity';
import { NotificationType } from '../../../domain/enums/notification-type.enum';

@Injectable()
export class PrismaNotificationRepository
  implements NotificationRepository {

  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<Notification, 'id' | 'createdAt' | 'lu'>,
  ): Promise<Notification> {
    const raw = await this.prisma.notification.create({
      data,
    });
    return this.toDomain(raw);
  }

  async findAll(
    userId: string,
    lu?: boolean,
  ): Promise<{ items: Notification[]; totalNonLues: number }> {
    const where: any = { userId };
    if (lu !== undefined) where.lu = lu;

    const [raws, totalNonLues] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({
        where: { userId, lu: false },
      }),
    ]);

    return {
      items: raws.map(this.toDomain),
      totalNonLues,
    };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { lu: true },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, lu: false },
      data: { lu: true },
    });
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
