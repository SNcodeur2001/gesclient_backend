import {
  IsEnum, IsOptional, IsUUID,
  IsNotEmpty, IsNumber, IsString, Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from
  '@nestjs/swagger';
import { CommandeType } from
  '../../../domain/enums/commande-type.enum';

class AcheteurInfoDto {
  @ApiProperty() @IsString() nom!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telephone?: string;
}

export class CreateCommandeDto {
  @ApiProperty({ enum: CommandeType })
  @IsEnum(CommandeType)
  type!: CommandeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  acheteurId?: string;

  @ApiPropertyOptional({ type: AcheteurInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AcheteurInfoDto)
  acheteurInfo?: AcheteurInfoDto;

  @ApiProperty({ example: 'Granulés PEHD' })
  @IsNotEmpty()
  @IsString()
  produit!: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  quantite!: number;

  @ApiProperty({ example: 300 })
  @IsNumber()
  @Min(0)
  prixUnitaire!: number;
}