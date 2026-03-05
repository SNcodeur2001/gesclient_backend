import { ApiProperty } from '@nestjs/swagger';

export class CollecteResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() apporteurId: string;
  @ApiProperty() apporteur: any;
  @ApiProperty() quantiteKg: number;
  @ApiProperty() prixUnitaire: number;
  @ApiProperty() montantTotal: number;
  @ApiProperty() notes: string;
  @ApiProperty() collecteurId: string;
  @ApiProperty() collecteur: any;
  @ApiProperty() createdAt: Date;
}