import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CollecteRepository } from
  '../../../domain/ports/repositories/collecte.repository';
import { Collecte } from
  '../../../domain/entities/collecte.entity';

@Injectable()
export class PrismaCollecteRepository
  implements CollecteRepository {

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Collecte | null> {
    const raw = await this.prisma.collecte.findUnique({
      where: { id },
      include: {
        apporteur: true,
        collecteur: true,
      },
    });
    return raw ? this.toDomain(raw) : null;
  }

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
    if (filters.collecteurId)
      where.collecteurId = filters.collecteurId;
    if (filters.apporteurId)
      where.apporteurId = filters.apporteurId;
    if (filters.dateDebut || filters.dateFin) {
      where.createdAt = {};
      if (filters.dateDebut)
        where.createdAt.gte = filters.dateDebut;
      if (filters.dateFin)
        where.createdAt.lte = filters.dateFin;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [raws, total, aggregation] = await Promise.all([
      this.prisma.collecte.findMany({
        where,
        include: { apporteur: true, collecteur: true },
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.collecte.count({ where }),
      this.prisma.collecte.aggregate({
        where,
        _sum: { quantiteKg: true, montantTotal: true },
      }),
    ]);

    return {
      items: raws.map(r => this.toDomain(r)),
      total,
      tonnageTotal: aggregation._sum.quantiteKg || 0,
      montantTotal: aggregation._sum.montantTotal || 0,
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
    const debutMois = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );
    const debutMoisPrecedent = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1,
    );

    // Stats mois actuel
    const [aggMois, countMois] = await Promise.all([
      this.prisma.collecte.aggregate({
        where: { createdAt: { gte: debutMois } },
        _sum: { quantiteKg: true, montantTotal: true },
      }),
      this.prisma.collecte.count({
        where: { createdAt: { gte: debutMois } },
      }),
    ]);

    // Top 5 apporteurs
    const topRaw = await this.prisma.collecte.groupBy({
      by: ['apporteurId'],
      _sum: { quantiteKg: true, montantTotal: true },
      orderBy: { _sum: { quantiteKg: 'desc' } },
      take: 5,
    });

    const topApporteurs = await Promise.all(
      topRaw.map(async item => {
        const client = await this.prisma.client.findUnique({
          where: { id: item.apporteurId },
        });
        return {
          id: item.apporteurId,
          nom: client?.nom || 'Inconnu',
          tonnage: item._sum.quantiteKg || 0,
          montant: item._sum.montantTotal || 0,
        };
      }),
    );

    // Évolution 6 derniers mois
    const collectes6mois = await this.prisma.collecte.findMany({
      where: { createdAt: { gte: debutMoisPrecedent } },
      select: { quantiteKg: true, createdAt: true },
    });

    const evolutionMap = new Map<string, number>();
    collectes6mois.forEach(c => {
      const key = `${c.createdAt.getFullYear()}-${String(
        c.createdAt.getMonth() + 1,
      ).padStart(2, '0')}`;
      evolutionMap.set(
        key,
        (evolutionMap.get(key) || 0) + c.quantiteKg,
      );
    });

    const moisLabels = ['Jan','Fév','Mar','Avr','Mai',
      'Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const evolutionMensuelle = Array.from(
      evolutionMap.entries(),
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, tonnage]) => {
        const [year, month] = key.split('-');
        return {
          mois: `${moisLabels[parseInt(month) - 1]} ${year}`,
          tonnage,
        };
      });

    return {
      tonnageTotalMois: aggMois._sum.quantiteKg || 0,
      montantTotalMois: aggMois._sum.montantTotal || 0,
      nombreCollectes: countMois,
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
    // Relations enrichies
    (collecte as any).apporteur = raw.apporteur;
    (collecte as any).collecteur = raw.collecteur;
    return collecte;
  }
}