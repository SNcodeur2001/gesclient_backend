import { Injectable, Inject } from '@nestjs/common';
import {
  NotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../../domain/ports/repositories/notification.repository';
import type { NotificationRepository as NotificationRepositoryType } from '../../domain/ports/repositories/notification.repository';

export interface MarkAsReadInput {
  id?: string;
  userId: string;
  all?: boolean;
}

@Injectable()
export class MarkAsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifRepo: NotificationRepositoryType,
  ) {}

  async execute(input: MarkAsReadInput): Promise<number | void> {
    if (input.all) {
      return this.notifRepo.markAllAsRead(input.userId);
    } else if (input.id) {
      return this.notifRepo.markAsRead(input.id, input.userId);
    }
  }
}
