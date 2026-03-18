import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ClientRepository } from '../../../domain/ports/repositories/client.repository';
import { Client } from '../../../domain/entities/client.entity';
import { ClientType } from '../../../domain/enums/client-type.enum';
import { ClientStatut } from '../../../domain/enums/client-statut.enum';

@Injectable()
export class PrismaClientRepository implements ClientRepository {
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

  async findById(id: string): Promise<Client | null> {
    const raw = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: { assignedUser: true },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<Client | null> {
    const raw = await this.prisma.client.findFirst({
      where: { email, deletedAt: null },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findAll(filters: {
    type?: ClientType;
    statut?: ClientStatut;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: Client[]; total: number; totalActifs: number; totalRevenue: number }> {
    const baseWhere: any = { deletedAt: null };
    if (filters.type) baseWhere.type = filters.type;
    if (filters.search) {
      baseWhere.OR = [
        { nom: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { telephone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    const where: any = { ...baseWhere };
    if (filters.statut) where.statut = filters.statut;

    const skip = (filters.page - 1) * filters.limit;
    const countActifsPromise =
      !filters.statut || filters.statut === ClientStatut.ACTIF
        ? this.withRetry('countActifs', () =>
            this.prisma.client.count({
              where: { ...baseWhere, statut: ClientStatut.ACTIF },
            }),
          )
        : Promise.resolve(0);

    const [raws, total, totalActifs, revenueAgg] = await Promise.all([
      this.withRetry('findManyClients', () =>
        this.prisma.client.findMany({
          where,
          include: { assignedUser: true },
          skip,
          take: filters.limit,
          orderBy: { createdAt: 'desc' },
        }),
      ),
      this.withRetry('countClients', () => this.prisma.client.count({ where })),
      countActifsPromise,
      this.withRetry('aggregateRevenue', () =>
        this.prisma.client.aggregate({
          where,
          _sum: { totalRevenue: true },
        }),
      ),
    ]);

    return {
      items: raws.map((r) => this.toDomain(r)),
      total,
      totalActifs,
      totalRevenue: revenueAgg._sum.totalRevenue || 0,
    };
  }

  async create(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const raw = await this.prisma.client.create({ data });
    return this.toDomain(raw);
  }

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const raw = await this.prisma.client.update({
      where: { id },
      data,
    });
    return this.toDomain(raw);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async exportAll(filters: {
    type?: ClientType;
    statut?: ClientStatut;
  }): Promise<Client[]> {
    const where: any = { deletedAt: null };
    if (filters.type) where.type = filters.type;
    if (filters.statut) where.statut = filters.statut;

    const raws = await this.withRetry('exportClients', () =>
      this.prisma.client.findMany({ where }),
    );
    return raws.map((r) => this.toDomain(r));
  }

  async createMany(data: Omit<Client, 'id' | 'createdAt'>[]): Promise<number> {
    const result = await this.prisma.client.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  private toDomain(raw: any): Client {
    const client = new Client();
    client.id = raw.id;
    client.nom = raw.nom;
    client.prenom = raw.prenom;
    client.email = raw.email;
    client.telephone = raw.telephone;
    client.adresse = raw.adresse;
    client.type = raw.type as ClientType;
    client.statut = raw.statut as ClientStatut;
    client.totalRevenue = raw.totalRevenue;
    client.notes = raw.notes;
    client.assignedUserId = raw.assignedUserId;
    client.createdAt = raw.createdAt;
    client.deletedAt = raw.deletedAt;
    return client;
  }
}
