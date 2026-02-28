import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CommandeRepository } from '../../../domain/ports/repositories/commande.repository';
import { Commande } from '../../../domain/entities/commande.entity';
import { CommandeStatut } from '../../../domain/enums/commande-statut.enum';
import { CommandeType } from '../../../domain/enums/commande-type.enum';

@Injectable()
export class PrismaCommandeRepository implements CommandeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Commande | null> {
    const raw = await this.prisma.commande.findUnique({
      where: { id },
      include: {
        paiements: true,
        acheteur: true,
        commercial: true,
      },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findAll(filters: {
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

    if (filters.commercialId) {
      where.commercialId = filters.commercialId;
    }
    if (filters.statut) {
      where.statut = filters.statut;
    }
    if (filters.type) {
      where.type = filters.type;
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

    // Execute main query and stats in parallel
    const [items, total, stats] = await Promise.all([
      this.prisma.commande.findMany({
        where,
        include: {
          acheteur: true,
          commercial: true,
        },
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commande.count({ where }),
      // Stats queries in parallel
      Promise.all([
        this.prisma.commande.aggregate({
          where,
          _sum: { montantTTC: true },
        }),
        this.prisma.commande.count({
          where: {
            ...where,
            statut: { in: [CommandeStatut.EN_PREPARATION, CommandeStatut.PRETE] },
          },
        }),
        this.prisma.commande.count({
          where: {
            ...where,
            statut: CommandeStatut.EN_ATTENTE_ACOMPTE,
          },
        }),
      ]),
    ]);

    return {
      items: items.map(this.toDomain),
      total,
      stats: {
        chiffreAffaires: stats[0]._sum.montantTTC || 0,
        commandesEnCours: stats[1],
        enAttenteAcompte: stats[2],
      },
    };
  }

  async create(
    data: Omit<Commande, 'id' | 'createdAt'>,
  ): Promise<Commande> {
    const raw = await this.prisma.commande.create({
      data,
      include: {
        acheteur: true,
        commercial: true,
      },
    });
    return this.toDomain(raw);
  }

  async update(id: string, data: Partial<Commande>): Promise<Commande> {
    const raw = await this.prisma.commande.update({
      where: { id },
      data,
      include: {
        acheteur: true,
        commercial: true,
        paiements: true,
      },
    });
    return this.toDomain(raw);
  }

  async countAll(): Promise<number> {
    return this.prisma.commande.count();
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
    return commande;
  }
}
