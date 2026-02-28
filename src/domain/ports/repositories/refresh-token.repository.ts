import { RefreshToken } from '../../entities/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';

export interface RefreshTokenRepository {
  create(data: {
    token: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken>;

  findByToken(token: string): Promise<RefreshToken | null>;

  findValidTokenByUserId(userId: string): Promise<RefreshToken | null>;

  revoke(id: string): Promise<void>;

  revokeAllByUserId(userId: string): Promise<void>;

  deleteExpired(): Promise<number>;
}
