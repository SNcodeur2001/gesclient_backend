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
  page: number;
  limit: number;
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
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.notifRepo.findAll(input.userId, input.lu, input.page, input.limit);
    return {
      ...result,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(result.total / input.limit),
    };
  }
}
