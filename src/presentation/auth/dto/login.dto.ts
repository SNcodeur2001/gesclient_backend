import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@proplast.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email!: string;

  @ApiProperty({ example: 'Test1234!' })
  @IsNotEmpty({ message: 'Mot de passe obligatoire' })
  @IsString()
  password!: string;
}
