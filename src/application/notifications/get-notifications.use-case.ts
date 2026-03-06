import { Injectable, Inject } from '@nestjs/common';
import {
  NotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../../domain/ports/repositories/notification.repository';
import type { NotificationRepository as NotificationRepositoryType } from '../../domain/ports/repositories/notification.repository';
import { Notification } from '../../domain/entities/notification.entity';

export interface GetNotificationsInput {
  userId: string;
  lu?: boolean;
}

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifRepo: NotificationRepositoryType,
  ) {}

  async execute(input: GetNotificationsInput): Promise<{
    items: Notification[];
    totalNonLues: number;
  }> {
    return this.notifRepo.findAll(input.userId, input.lu);
  }
}
