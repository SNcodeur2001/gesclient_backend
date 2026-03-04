import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AssignedUserDto {
  @Expose()
  @ApiProperty({ description: 'ID de l\'utilisateur assigné' })
  id!: string;

  @Expose()
  @ApiProperty({ description: 'Nom de l\'utilisateur' })
  nom!: string;

  @Expose()
  @ApiProperty({ description: 'Prénom de l\'utilisateur' })
  prenom!: string;

  @Expose()
  @ApiProperty({ description: 'Rôle de l\'utilisateur', enum: ['ADMIN', 'DIRECTEUR', 'COMMERCIAL'] })
  role!: string;
}

export class ClientResponseDto {
  @Expose()
  @ApiProperty({ description: 'ID unique du client' })
  id!: string;

  @Expose()
  @ApiProperty({ description: 'Nom du client ou raison sociale' })
  nom!: string;

  @Expose()
  @ApiProperty({ description: 'Prénom du contact (optionnel)', required: false })
  prenom!: string;

  @Expose()
  @ApiProperty({ description: 'Email du client', required: false })
  email!: string;

  @Expose()
  @ApiProperty({ description: 'Téléphone du client', required: false })
  telephone!: string;

  @Expose()
  @ApiProperty({ description: 'Adresse du client', required: false })
  adresse!: string;

  @Expose()
  @ApiProperty({ description: 'Type de client', enum: ['APPORTEUR', 'ACHETEUR'] })
  type!: string;

  @Expose()
  @ApiProperty({ description: 'Statut du client', enum: ['ACTIF', 'PROSPECT', 'INACTIF'] })
  statut!: string;

  @Expose()
  @ApiProperty({ description: 'Revenu total généré par le client', required: false })
  totalRevenue!: number;

  @Expose()
  @ApiProperty({ description: 'Notes additionnelles sur le client', required: false })
  notes!: string;

  @Expose()
  @ApiProperty({ description: 'Date de création du client' })
  createdAt!: Date;

  @Expose()
  @Type(() => AssignedUserDto)
  @ApiProperty({ description: 'Utilisateur assigné à ce client', type: AssignedUserDto, required: false })
  assignedTo?: AssignedUserDto;
}