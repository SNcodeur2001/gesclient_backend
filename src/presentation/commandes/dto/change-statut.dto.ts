import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommandeStatut } from '../../../domain/enums/commande-statut.enum';

export class ChangeStatutDto {
  @ApiProperty({ enum: CommandeStatut })
  @IsEnum(CommandeStatut)
  statut!: CommandeStatut;
}
