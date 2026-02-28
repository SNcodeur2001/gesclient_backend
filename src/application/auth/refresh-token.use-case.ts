import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { TOKEN_SERVICE } from '../../domain/ports/services/token.service';
import type { TokenService } from '../../domain/ports/services/token.service';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/repositories/refresh-token.repository';
import type { RefreshTokenRepository } from '../../domain/ports/repositories/refresh-token.repository';
import { HASH_SERVICE } from '../../domain/ports/services/hash.service';
import type { HashService } from '../../domain/ports/services/hash.service';
import { USER_REPOSITORY } from '../../domain/ports/repositories/user.repository';
import type { UserRepository } from '../../domain/ports/repositories/user.repository';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';

export interface RefreshTokenOutput {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(HASH_SERVICE)
    private readonly hashService: HashService,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokenOutput> {
    // 1. Verify the refresh token
    let tokenPayload: { id: string };
    try {
      tokenPayload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // 2. Find the stored refresh token
    const storedToken = await this.refreshTokenRepo.findByToken(refreshToken);
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token non trouvé');
    }

    // 3. Check if token is revoked
    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token révoqué');
    }

    // 4. Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expiré');
    }

    // 5. Verify the token hash
    const isValid = await this.hashService.compare(refreshToken, storedToken.tokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // 6. Find the user
    const user = await this.userRepo.findById(tokenPayload.id);
    if (!user || !user.actif) {
      throw new InvalidCredentialsException();
    }

    // 7. Rotate the refresh token (revoke old one)
    await this.refreshTokenRepo.revoke(storedToken.id);

    // 8. Generate new tokens
    const newAccessToken = this.tokenService.signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = this.tokenService.signRefreshToken({
      id: user.id,
    });

    // 9. Hash the new refresh token and store it
    const refreshTokenHash = await this.hashService.hash(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenRepo.create({
      token: newRefreshToken,
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt,
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }
}
