import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RefreshTokenRepository } from '../../../domain/ports/repositories/refresh-token.repository';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    token: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    const raw = await this.prisma.refreshToken.create({ data });
    return this.toDomain(raw);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const raw = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findValidTokenByUserId(userId: string): Promise<RefreshToken | null> {
    const now = new Date();
    const raw = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
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
