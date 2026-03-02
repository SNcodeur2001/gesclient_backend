import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthController } from './auth.controller';
import { JwtStrategy } from './guards/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

import { LoginUseCase } from
  '../../application/auth/login.use-case';
import { RefreshTokenUseCase } from
  '../../application/auth/refresh-token.use-case';
import { LogoutUseCase } from
  '../../application/auth/logout.use-case';
import { GetProfileUseCase } from
  '../../application/auth/get-profile.use-case';

import { PrismaUserRepository } from
  '../../infrastructure/database/repositories/prisma-user.repository';
import { PrismaRefreshTokenRepository } from
  '../../infrastructure/database/repositories/prisma-refresh-token.repository';
import { BcryptHashService } from
  '../../infrastructure/services/bcrypt-hash.service';
import { JwtTokenService } from
  '../../infrastructure/services/jwt-token.service';
import { PrismaAuditLogRepository } from
  '../../infrastructure/database/repositories/prisma-audit-log.repository';
import { TokenBlacklistServiceImpl } from
  '../../infrastructure/services/token-blacklist.service';

import { USER_REPOSITORY } from
  '../../domain/ports/repositories/user.repository';
import { REFRESH_TOKEN_REPOSITORY } from
  '../../domain/ports/repositories/refresh-token.repository';
import { HASH_SERVICE } from
  '../../domain/ports/services/hash.service';
import { TOKEN_SERVICE } from
  '../../domain/ports/services/token.service';
import { AUDIT_LOG_REPOSITORY } from
  '../../domain/ports/repositories/audit-log.repository';
import { TOKEN_BLACKLIST_SERVICE } from
  '../../infrastructure/services/token-blacklist.service';

@Module({
  imports: [
    PassportModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        store: 'redis',
        host: config.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(config.get<string>('REDIS_PORT') || '6379'),
        ttl: 900, // 15 minutes in seconds (max TTL for access tokens)
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Use Cases
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetProfileUseCase,

    // Guards
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,

    // Bindings interfaces → implémentations
    { provide: USER_REPOSITORY,
      useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository },
    { provide: HASH_SERVICE,
      useClass: BcryptHashService },
    { provide: TOKEN_SERVICE,
      useClass: JwtTokenService },
    { provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository },
    { provide: TOKEN_BLACKLIST_SERVICE,
      useClass: TokenBlacklistServiceImpl },
  ],
  exports: [JwtAuthGuard, RolesGuard, JwtStrategy],
})
export class AuthModule {}
