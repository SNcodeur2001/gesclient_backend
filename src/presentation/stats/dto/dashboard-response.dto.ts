import { ApiProperty } from '@nestjs/swagger';

class CollecteStatsDto {
  @ApiProperty() tonnageMois: number;
  @ApiProperty() montantMois: number;
  @ApiProperty() variationMois: string;
}

class CommercialStatsDto {
  @ApiProperty() chiffreAffairesMois: number;
  @ApiProperty() commandesEnCours: number;
  @ApiProperty() enAttenteAcompte: number;
  @ApiProperty() variationMois: string;
}

class ClientStatsDto {
  @ApiProperty() totalApporteurs: number;
  @ApiProperty() totalAcheteurs: number;
  @ApiProperty() nouveauxCeMois: number;
}

class TopApporteurDto {
  @ApiProperty() id: string;
  @ApiProperty() nom: string;
  @ApiProperty() tonnage: number;
  @ApiProperty() montant: number;
}

class TopAcheteurDto {
  @ApiProperty() id: string;
  @ApiProperty() nom: string;
  @ApiProperty() chiffreAffaires: number;
}

class EvolutionDto {
  @ApiProperty() mois: string;
  @ApiProperty() tonnage: number;
}

class EvolutionCADto {
  @ApiProperty() mois: string;
  @ApiProperty() montant: number;
}

export class DashboardResponseDto {
  @ApiProperty({ type: CollecteStatsDto })
  collecte: CollecteStatsDto;

  @ApiProperty({ type: CommercialStatsDto })
  commercial: CommercialStatsDto;

  @ApiProperty({ type: ClientStatsDto })
  clients: ClientStatsDto;

  @ApiProperty({ type: [TopApporteurDto] })
  topApporteurs: TopApporteurDto[];

  @ApiProperty({ type: [TopAcheteurDto] })
  topAcheteurs: TopAcheteurDto[];

  @ApiProperty({ type: [EvolutionDto] })
  evolutionCollecte: EvolutionDto[];

  @ApiProperty({ type: [EvolutionCADto] })
  evolutionCA: EvolutionCADto[];
}
