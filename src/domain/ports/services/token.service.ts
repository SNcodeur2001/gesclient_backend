import { Role } from '../../enums/role.enum';

export const TOKEN_SERVICE = 'TOKEN_SERVICE';

export interface TokenService {
  signAccessToken(payload: { id: string; email: string; role: Role }): string;

  verifyAccessToken(token: string): {
    id: string;
    email: string;
    role: Role;
  };

  signRefreshToken(payload: { id: string }): string;

  verifyRefreshToken(token: string): {
    id: string;
  };
}
