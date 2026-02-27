import { Role } from '../../enums/role.enum';

export const TOKEN_SERVICE = 'TOKEN_SERVICE';

export interface TokenService {
  sign(payload: {
    id: string;
    email: string;
    role: Role;
  }): string;
  verify(token: string): {
    id: string;
    email: string;
    role: Role;
  };
}
