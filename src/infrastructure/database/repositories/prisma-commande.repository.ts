import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CommandeRepository,
  CreateCommandeData,
  UpdateCommandeData,
} from '../../../domain/ports/repositories/commande.repository';
import { Commande } from '../../../domain/entities/commande.entity';
import { CommandeStatut } from '../../../domain/enums/commande-statut.enum';
import { CommandeType } from '../../../domain/enums/commande-type.enum';

@Injectable()
export class PrismaCommandeRepository implements CommandeRepository {
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

  async findById(id: string): Promise<Commande | null> {
    const raw = await this.prisma.commande.findUnique({
      where: { id },
      include: {
        acheteur: true,
        commercial: true,
        paiements: { orderBy: { createdAt: 'asc' } },
        items: true,
      },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findAll(filters: {
    search?: string;
    commercialId?: string;
    statut?: CommandeStatut;
    type?: CommandeType;
    dateDebut?: Date;
    dateFin?: Date;
    page: number;
    limit: number;
  }): Promise<{
    items: Commande[];
    total: number;
    stats: {
      chiffreAffaires: number;
      commandesEnCours: number;
      enAttenteAcompte: number;
    };
  }> {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { reference: { contains: filters.search, mode: 'insensitive' } },
        { produit: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.commercialId) where.commercialId = filters.commercialId;
    if (filters.statut) where.statut = filters.statut;
    if (filters.type) where.type = filters.type;
    if (filters.dateDebut || filters.dateFin) {
      where.createdAt = {};
      if (filters.dateDebut) where.createdAt.gte = filters.dateDebut;
      if (filters.dateFin) where.createdAt.lte = filters.dateFin;
    }

    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

    const skip = (filters.page - 1) * filters.limit;

    const [raws, total, caAgg, enCours, enAttente] = await Promise.all([
      this.withRetry('findManyCommandes', () =>
        this.prisma.commande.findMany({
          where,
          include: {
            acheteur: true,
            commercial: true,
            paiements: true,
          },
          skip,
          take: filters.limit,
          orderBy: { createdAt: 'desc' },
        }),
      ),
      this.withRetry('countCommandes', () => this.prisma.commande.count({ where })),
      this.withRetry('aggregateCA', () =>
        this.prisma.commande.aggregate({
          where: {
            ...where,
            statut: CommandeStatut.FINALISEE,
            createdAt: { gte: debutMois },
          },
          _sum: { montantTTC: true },
        }),
      ),
      this.withRetry('countEnCours', () =>
        this.prisma.commande.count({
          where: {
            ...where,
            statut: {
              notIn: [CommandeStatut.FINALISEE],
            },
          },
        }),
      ),
      this.withRetry('countEnAttente', () =>
        this.prisma.commande.count({
          where: {
            ...where,
            statut: CommandeStatut.EN_PREPARATION,
          },
        }),
      ),
    ]);

    return {
      items: raws.map((r) => this.toDomain(r)),
      total,
      stats: {
        chiffreAffaires: caAgg._sum.montantTTC || 0,
        commandesEnCours: enCours,
        enAttenteAcompte: enAttente,
      },
    };
  }

  async create(data: CreateCommandeData): Promise<Commande> {
    // Préparer les données pour Prisma - transformer les items au format nested create
    const prismaData: any = { ...data };

    if (data.items && data.items.length > 0) {
      prismaData.items = {
        create: data.items.map((item) => ({
          produit: item.produit,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
        })),
      };
    }

    const raw = await this.prisma.commande.create({
      data: prismaData,
      include: { acheteur: true, commercial: true },
    });
    return this.toDomain(raw);
  }

  async update(id: string, data: UpdateCommandeData): Promise<Commande> {
    const raw = await this.prisma.commande.update({
      where: { id },
      data: data as any,
      include: {
        acheteur: true,
        commercial: true,
        paiements: true,
      },
    });
    return this.toDomain(raw);
  }

  async countAll(): Promise<number> {
    return this.withRetry('countAllCommandes', () => this.prisma.commande.count());
  }

  private toDomain(raw: any): Commande {
    const commande = new Commande();
    commande.id = raw.id;
    commande.reference = raw.reference;
    commande.type = raw.type as CommandeType;
    commande.statut = raw.statut as CommandeStatut;
    commande.acheteurId = raw.acheteurId;
    commande.produit = raw.produit;
    commande.quantite = raw.quantite;
    commande.prixUnitaire = raw.prixUnitaire;
    commande.montantHT = raw.montantHT;
    commande.tva = raw.tva;
    commande.montantTTC = raw.montantTTC;
    commande.acompteMinimum = raw.acompteMinimum;
    commande.acompteVerse = raw.acompteVerse;
    commande.soldeRestant = raw.soldeRestant;
    commande.commercialId = raw.commercialId;
    commande.createdAt = raw.createdAt;
    // Relations enrichies
    (commande as any).acheteur = raw.acheteur;
    (commande as any).commercial = raw.commercial;
    (commande as any).paiements = raw.paiements;
    return commande;
  }
}
