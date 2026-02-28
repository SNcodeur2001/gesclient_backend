import { Injectable, Inject } from '@nestjs/common';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/repositories/refresh-token.repository';
import type { RefreshTokenRepository } from '../../domain/ports/repositories/refresh-token.repository';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async execute(userId: string, refreshToken?: string): Promise<void> {
    // If a specific refresh token is provided, revoke only that one
    if (refreshToken) {
      // The refresh token will be handled by the repository
      // We need to find and revoke it
      const storedToken = await this.refreshTokenRepo.findByToken(refreshToken);
      if (storedToken) {
        await this.refreshTokenRepo.revoke(storedToken.id);
      }
    } else {
      // Revoke all refresh tokens for the user
      await this.refreshTokenRepo.revokeAllByUserId(userId);
    }
  }
}
