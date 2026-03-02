import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AssignedUserDto {
  @Expose() @ApiProperty() id!: string;
  @Expose() @ApiProperty() nom!: string;
  @Expose() @ApiProperty() prenom!: string;
  @Expose() @ApiProperty() role!: string;
}

export class ClientResponseDto {
  @Expose() @ApiProperty() id!: string;
  @Expose() @ApiProperty() nom!: string;
  @Expose() @ApiProperty() prenom!: string;
  @Expose() @ApiProperty() email!: string;
  @Expose() @ApiProperty() telephone!: string;
  @Expose() @ApiProperty() adresse!: string;
  @Expose() @ApiProperty() type!: string;
  @Expose() @ApiProperty() statut!: string;
  @Expose() @ApiProperty() totalRevenue!: number;
  @Expose() @ApiProperty() notes!: string;
  @Expose() @ApiProperty() createdAt!: Date;

  @Expose()
  @Type(() => AssignedUserDto)
  @ApiProperty({ type: AssignedUserDto })
  assignedTo?: AssignedUserDto;
}