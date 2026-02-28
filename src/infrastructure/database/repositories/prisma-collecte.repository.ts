import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CollecteRepository } from '../../../domain/ports/repositories/collecte.repository';
import { Collecte } from '../../../domain/entities/collecte.entity';

@Injectable()
export class PrismaCollecteRepository implements CollecteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<Collecte, 'id' | 'createdAt'>,
  ): Promise<Collecte> {
    const raw = await this.prisma.collecte.create({
      data,
      include: {
        apporteur: true,
        collecteur: true,
      },
    });
    return this.toDomain(raw);
  }

  async findAll(filters: {
    collecteurId?: string;
    apporteurId?: string;
    dateDebut?: Date;
    dateFin?: Date;
    page: number;
    limit: number;
  }): Promise<{
    items: Collecte[];
    total: number;
    tonnageTotal: number;
    montantTotal: number;
  }> {
    const where: any = {};

    if (filters.collecteurId) {
      where.collecteurId = filters.collecteurId;
    }
    if (filters.apporteurId) {
      where.apporteurId = filters.apporteurId;
    }
    if (filters.dateDebut || filters.dateFin) {
      where.createdAt = {};
      if (filters.dateDebut) {
        where.createdAt.gte = filters.dateDebut;
      }
      if (filters.dateFin) {
        where.createdAt.lte = filters.dateFin;
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const [items, aggregations] = await Promise.all([
      this.prisma.collecte.findMany({
        where,
        include: {
          apporteur: true,
          collecteur: true,
        },
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.collecte.aggregate({
        where,
        _sum: {
          quantiteKg: true,
          montantTotal: true,
        },
        _count: true,
      }),
    ]);

    return {
      items: items.map(this.toDomain),
      total: aggregations._count,
      tonnageTotal: aggregations._sum.quantiteKg || 0,
      montantTotal: aggregations._sum.montantTotal || 0,
    };
  }

  async getStats(): Promise<{
    tonnageTotalMois: number;
    montantTotalMois: number;
    nombreCollectes: number;
    topApporteurs: {
      id: string;
      nom: string;
      tonnage: number;
      montant: number;
    }[];
    evolutionMensuelle: {
      mois: string;
      tonnage: number;
    }[];
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Current month stats
    const currentMonthStats = await this.prisma.collecte.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        quantiteKg: true,
        montantTotal: true,
      },
      _count: true,
    });

    // Top apporteurs by tonnage
    const topApporteursRaw = await this.prisma.collecte.groupBy({
      by: ['apporteurId'],
      _sum: {
        quantiteKg: true,
        montantTotal: true,
      },
      orderBy: {
        _sum: {
          quantiteKg: 'desc',
        },
      },
      take: 5,
    });

    // Get apporteur names
    const apporteurIds = topApporteursRaw.map((r) => r.apporteurId);
    const apporteurs = await this.prisma.client.findMany({
      where: { id: { in: apporteurIds } },
      select: { id: true, nom: true },
    });

    const apporteurMap = new Map(apporteurs.map((a) => [a.id, a.nom]));

    const topApporteurs = topApporteursRaw.map((r) => ({
      id: r.apporteurId,
      nom: apporteurMap.get(r.apporteurId) || 'Inconnu',
      tonnage: r._sum.quantiteKg || 0,
      montant: r._sum.montantTotal || 0,
    }));

    // Monthly evolution (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Get all collectes from last 6 months
    const lastSixMonthsCollectes = await this.prisma.collecte.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        quantiteKg: true,
      },
    });

    // Group by month manually
    const monthlyMap = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, 0);
    }

    for (const c of lastSixMonthsCollectes) {
      const monthKey = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, current + c.quantiteKg);
    }

    const evolutionMensuelle = Array.from(monthlyMap.entries())
      .map(([mois, tonnage]) => ({ mois, tonnage }))
      .sort((a, b) => a.mois.localeCompare(b.mois));

    return {
      tonnageTotalMois: currentMonthStats._sum.quantiteKg || 0,
      montantTotalMois: currentMonthStats._sum.montantTotal || 0,
      nombreCollectes: currentMonthStats._count,
      topApporteurs,
      evolutionMensuelle,
    };
  }

  private toDomain(raw: any): Collecte {
    const collecte = new Collecte();
    collecte.id = raw.id;
    collecte.apporteurId = raw.apporteurId;
    collecte.quantiteKg = raw.quantiteKg;
    collecte.prixUnitaire = raw.prixUnitaire;
    collecte.montantTotal = raw.montantTotal;
    collecte.notes = raw.notes;
    collecte.collecteurId = raw.collecteurId;
    collecte.createdAt = raw.createdAt;
    return collecte;
  }
}
