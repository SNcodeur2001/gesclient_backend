import { Injectable, Inject } from '@nestjs/common';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/repositories/refresh-token.repository';
import type { RefreshTokenRepository } from '../../domain/ports/repositories/refresh-token.repository';
import { TOKEN_BLACKLIST_SERVICE } from '../../infrastructure/services/token-blacklist.service';
import type { TokenBlacklistService } from '../../infrastructure/services/token-blacklist.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(TOKEN_BLACKLIST_SERVICE)
    private readonly blacklistService: TokenBlacklistService,
  ) {}

  async execute(userId: string, accessToken?: string, refreshToken?: string): Promise<void> {
    // 1. Blacklist the access token if provided
    // TTL = 15 minutes (900 seconds) - matches access token expiration
    if (accessToken) {
      const ttlSeconds = 15 * 60; // 15 minutes
      await this.blacklistService.addToBlacklist(accessToken, ttlSeconds);
    }

    // 2. If a specific refresh token is provided, revoke only that one
    if (refreshToken) {
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
