import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '../../../domain/enums/audit-action.enum';

export class AuditLogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: AuditAction })
  action!: AuditAction;

  @ApiProperty()
  entite!: string;

  @ApiProperty()
  entiteId!: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  ancienneValeur?: object;

  @ApiProperty({ required: false })
  nouvelleValeur?: object;

  @ApiProperty()
  createdAt!: Date;
}
