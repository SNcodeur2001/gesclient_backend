import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../domain/ports/services/token.service';
import { Role } from '../../domain/enums/role.enum';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: {
    id: string;
    email: string;
    role: Role;
  }): string {
    return this.jwtService.sign(payload);
  }

  verify(token: string): {
    id: string;
    email: string;
    role: Role;
  } {
    return this.jwtService.verify(token);
  }
}
