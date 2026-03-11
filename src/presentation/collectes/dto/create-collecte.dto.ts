import {
  IsOptional,
  IsUUID,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

class ApporteurInfoDto {
  @ApiProperty({ example: 'Moussa Traoré' })
  @IsString()
  nom!: string;

  @ApiPropertyOptional({ example: '+221 77 456 78 90' })
  @IsOptional()
  @IsString()
  telephone?: string;
}

/**
 * Item de collecte pour le nouveau système multi-types
 */
export class CollecteItemDto {
  @ApiProperty({ example: 'Plastique PP' })
  @IsString()
  typePlastique!: string;

  @ApiProperty({ example: 150.5 })
  @IsNumber()
  @Min(0)
  quantiteKg!: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0)
  prixUnitaire!: number;
}

export class CreateCollecteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  apporteurId?: string;

  // =============================================
  // Ancien système - un seul type (pour compatibilité)
  // =============================================
  @ApiPropertyOptional({ example: 150.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantiteKg?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prixUnitaire?: number;

  // =============================================
  // Nouveau système - plusieurs types de plastiques
  // =============================================
  @ApiPropertyOptional({ type: [CollecteItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollecteItemDto)
  items?: CollecteItemDto[];

  @ApiPropertyOptional({ example: 'Plastique PP propre' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: ApporteurInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ApporteurInfoDto)
  apporteurInfo?: ApporteurInfoDto;
}
