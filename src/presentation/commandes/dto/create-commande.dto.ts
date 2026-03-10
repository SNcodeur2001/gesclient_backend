import {
  IsEnum, IsOptional, IsUUID,
  IsNotEmpty, IsNumber, IsString, Min,
  ValidateNested, IsArray, IsNotEmptyObject,
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

/**
 * Item de commande pour le nouveau système multi-produits
 */
export class CommandeItemDto {
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

  // =============================================
  // Ancien système - un seul produit (pour compatibilité)
  // =============================================
  @ApiPropertyOptional({ example: 'Granulés PEHD' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  produit?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantite?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prixUnitaire?: number;

  // =============================================
  // Nouveau système - plusieurs produits
  // =============================================
  @ApiPropertyOptional({ type: [CommandeItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommandeItemDto)
  items?: CommandeItemDto[];
}
