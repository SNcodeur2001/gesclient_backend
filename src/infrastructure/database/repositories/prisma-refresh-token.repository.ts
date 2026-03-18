import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RefreshTokenRepository } from '../../../domain/ports/repositories/refresh-token.repository';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async withRetry<T>(label: string, fn: () => Promise<T>, attempts = 2): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        if (err?.code !== 'ETIMEDOUT' || i === attempts - 1) {
          throw err;
        }
        const delayMs = 200 + i * 200;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError;
  }

  async create(data: {
    token: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    const raw = await this.withRetry('createRefreshToken', () =>
      this.prisma.refreshToken.create({ data }),
    );
    return this.toDomain(raw);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const raw = await this.withRetry('findRefreshTokenByToken', () =>
      this.prisma.refreshToken.findUnique({
        where: { token },
      }),
    );
    return raw ? this.toDomain(raw) : null;
  }

  async findValidTokenByUserId(userId: string): Promise<RefreshToken | null> {
    const now = new Date();
    const raw = await this.withRetry('findValidTokenByUserId', () =>
      this.prisma.refreshToken.findFirst({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
    return raw ? this.toDomain(raw) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.withRetry('revokeRefreshToken', () =>
      this.prisma.refreshToken.update({
        where: { id },
        data: { revokedAt: new Date() },
      }),
    );
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.withRetry('revokeAllRefreshTokens', () =>
      this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.withRetry('deleteExpiredRefreshTokens', () =>
      this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      }),
    );
    return result.count;
  }

  private toDomain(raw: any): RefreshToken {
    const token = new RefreshToken();
    token.id = raw.id;
    token.token = raw.token;
    token.tokenHash = raw.tokenHash;
    token.userId = raw.userId;
    token.expiresAt = raw.expiresAt;
    token.revokedAt = raw.revokedAt;
    token.createdAt = raw.createdAt;
    return token;
  }
}
