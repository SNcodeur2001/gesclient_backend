import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TOKEN_BLACKLIST_SERVICE } from '../../../infrastructure/services/token-blacklist.service';
import type { TokenBlacklistService } from '../../../infrastructure/services/token-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(TOKEN_BLACKLIST_SERVICE)
    private readonly blacklistService: TokenBlacklistService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, check if token is blacklisted before letting Passport validate
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);

    if (token) {
      // Check if token is blacklisted
      const isBlacklisted = await this.blacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token révoqué');
      }
    }

    // Let the default AuthGuard (Passport) handle JWT validation
    return (await super.canActivate(context)) as boolean;
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
