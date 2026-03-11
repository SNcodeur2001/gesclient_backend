import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../domain/ports/services/token.service';
import { Role } from '../../domain/enums/role.enum';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: { id: string; email: string; role: Role }): string {
    return this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
  }

  verifyAccessToken(token: string): {
    id: string;
    email: string;
    role: Role;
  } {
    return this.jwtService.verify(token);
  }

  signRefreshToken(payload: { id: string }): string {
    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }

  verifyRefreshToken(token: string): {
    id: string;
  } {
    return this.jwtService.verify(token);
  }
}
