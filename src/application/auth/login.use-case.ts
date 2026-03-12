import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/ports/repositories/user.repository';
import type { UserRepository } from '../../domain/ports/repositories/user.repository';
import { HASH_SERVICE } from '../../domain/ports/services/hash.service';
import type { HashService } from '../../domain/ports/services/hash.service';
import { TOKEN_SERVICE } from '../../domain/ports/services/token.service';
import type { TokenService } from '../../domain/ports/services/token.service';
import { AUDIT_LOG_REPOSITORY } from '../../domain/ports/repositories/audit-log.repository';
import type { AuditLogRepository } from '../../domain/ports/repositories/audit-log.repository';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/repositories/refresh-token.repository';
import type { RefreshTokenRepository } from '../../domain/ports/repositories/refresh-token.repository';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { AuditAction } from '../../domain/enums/audit-action.enum';

export interface LoginOutput {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(HASH_SERVICE)
    private readonly hashService: HashService,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async execute(email: string, password: string): Promise<LoginOutput> {
    // 1. Trouver l'utilisateur
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    // 2. Vérifier le mot de passe
    const isValid = await this.hashService.compare(password, user.password);
    if (!isValid) {
      throw new InvalidCredentialsException();
    }

    // 3. Générer l'access token
    const accessToken = this.tokenService.signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 4. Générer le refresh token
    const refreshToken = this.tokenService.signRefreshToken({
      id: user.id,
    });

    // 5. Hasher le refresh token et le stocker
    const refreshTokenHash = await this.hashService.hash(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    await this.refreshTokenRepo.create({
      token: refreshToken,
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt,
    });

    // 6. Audit log
    await this.auditRepo.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      entite: 'User',
      entiteId: user.id,
      description: `Connexion de ${user.prenom} ${user.nom} (${user.email})`,
      nouvelleValeur: { email: user.email },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
