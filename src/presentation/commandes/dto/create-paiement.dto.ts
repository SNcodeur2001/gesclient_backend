import { IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaiementType } from
  '../../../domain/enums/paiement-type.enum';
import { ModePaiement } from
  '../../../domain/enums/mode-paiement.enum';

export class CreatePaiementDto {
  @ApiProperty({ enum: PaiementType })
  @IsEnum(PaiementType)
  type!: PaiementType;

  @ApiProperty({ example: 90000 })
  @IsNumber()
  @Min(1)
  montant!: number;

  @ApiProperty({ enum: ModePaiement })
  @IsEnum(ModePaiement)
  modePaiement!: ModePaiement;
}