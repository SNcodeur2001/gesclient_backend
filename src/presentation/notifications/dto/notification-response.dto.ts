import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../../domain/enums/notification-type.enum';

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  lu!: boolean;

  @ApiProperty({ required: false })
  lien?: string;

  @ApiProperty({ required: false })
  clientId?: string;

  @ApiProperty({ required: false })
  commandeId?: string;

  @ApiProperty()
  createdAt!: Date;
}
