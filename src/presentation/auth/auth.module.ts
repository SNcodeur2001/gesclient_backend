import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

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

@Module({
  imports: [
    PassportModule,
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
  ],
  exports: [JwtAuthGuard, RolesGuard, JwtStrategy],
})
export class AuthModule {}