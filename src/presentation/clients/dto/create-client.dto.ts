import {
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientType } from '../../../domain/enums/client-type.enum';
import { ClientStatut } from '../../../domain/enums/client-statut.enum';

export class CreateClientDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsNotEmpty({ message: 'Nom obligatoire' })
  @IsString()
  nom!: string;

  @ApiPropertyOptional({ example: 'Jean' })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({ example: 'contact@acme.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @ApiPropertyOptional({ example: '+221 77 123 45 67' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ example: 'Dakar, Sénégal' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: ClientType })
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @ApiPropertyOptional({ enum: ClientStatut, example: 'ACTIF' })
  @IsOptional()
  @IsEnum(ClientStatut)
  statut?: ClientStatut;
}
