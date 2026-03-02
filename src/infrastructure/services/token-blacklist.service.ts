import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export const TOKEN_BLACKLIST_SERVICE = 'TOKEN_BLACKLIST_SERVICE';

export interface TokenBlacklistService {
  addToBlacklist(token: string, ttlSeconds: number): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
}

@Injectable()
export class TokenBlacklistServiceImpl implements TokenBlacklistService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async addToBlacklist(token: string, ttlSeconds: number): Promise<void> {
    // Use 'blacklist:' prefix to identify blacklisted tokens in Redis
    await this.cacheManager.set(`blacklist:${token}`, true, ttlSeconds * 1000);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.cacheManager.get<boolean>(`blacklist:${token}`);
    return result === true;
  }
}
