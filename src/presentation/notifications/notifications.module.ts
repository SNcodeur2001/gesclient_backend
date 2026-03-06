import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { GetNotificationsUseCase } from '../../application/notifications/get-notifications.use-case';
import { MarkAsReadUseCase } from '../../application/notifications/mark-as-read.use-case';

import { PrismaNotificationRepository } from '../../infrastructure/database/repositories/prisma-notification.repository';

import { NOTIFICATION_REPOSITORY } from '../../domain/ports/repositories/notification.repository';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    // Use Cases
    GetNotificationsUseCase,
    MarkAsReadUseCase,

    // Bindings
    { provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository },
  ],
})
export class NotificationsModule {}
