import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: "ID unique de l'utilisateur" })
  id!: string;

  @ApiProperty({ description: "Nom de l'utilisateur" })
  nom!: string;

  @ApiProperty({ description: "Prénom de l'utilisateur" })
  prenom!: string;

  @ApiProperty({ description: "Email de l'utilisateur" })
  email!: string;

  @ApiProperty({
    description: "Rôle de l'utilisateur (ADMIN, DIRECTEUR, COMMERCIAL)",
    enum: ['ADMIN', 'DIRECTEUR', 'COMMERCIAL'],
  })
  role!: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: "Token d'accès JWT pour l'authentification",
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;

  @ApiProperty({
    description: "Token de rafraîchissement pour renew le token d'accès",
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token!: string;

  @ApiProperty({
    description: "Informations de l'utilisateur connecté",
    type: UserDto,
  })
  user!: UserDto;
}
