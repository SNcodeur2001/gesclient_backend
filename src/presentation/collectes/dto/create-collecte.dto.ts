import {
  IsOptional, IsUUID, IsNumber,
  IsString, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from
  '@nestjs/swagger';

class ApporteurInfoDto {
  @ApiProperty({ example: 'Moussa Traoré' })
  @IsString()
  nom!: string;

  @ApiPropertyOptional({ example: '+221 77 456 78 90' })
  @IsOptional()
  @IsString()
  telephone?: string;
}

export class CreateCollecteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  apporteurId?: string;

  @ApiProperty({ example: 150.5 })
  @IsNumber()
  @Min(0)
  quantiteKg!: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0)
  prixUnitaire!: number;

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